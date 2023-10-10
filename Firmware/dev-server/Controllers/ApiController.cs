using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Policy;
using System.Threading;
using System.Web;
using System.Web.Mvc;
using WebGrease.Extensions;
using WebUI.Models;

namespace WebUI.Controllers
{
    public class ApiController : Controller
    {

        //private static readonly ConcurrentQueue<StreamWriter> _streammessage = new ConcurrentQueue<StreamWriter>();
        private static readonly WorkSpace ws = new WorkSpace();

        //GET: PipeName
        public ActionResult PipeName()
        {
            return new ContentResult() { ContentType = "text/plain", Content = "ws://" + Request.Url.Host + ":" + Request.Url.Port + "/pipe.ashx" };
        }


        public ActionResult EventSourceName()
        {
            return new ContentResult() { ContentType = "text/plain", Content = "http://" + Request.Url.Host + ":" + Request.Url.Port + "/api/get?" + Server.UrlEncode("{\"client\":\"" + (Guid.NewGuid().ToString()) + "\"}") };
        }

        /// <summary>
        /// When the user makes a GET request, 
        /// we’ll create a new HttpResponseMessage using PushStreamContent object 
        /// and text/event-stream content type. 
        /// PushStreamContent takes an Action&lt;Stream, HttpContentHeaders, TransportContext&gt; onStreamAvailable parameter in the constructor, 
        /// and that in turn allows us to manipulate the response stream.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public HttpResponseMessage Get()
        {
            try
            {
                var json = Server.UrlDecode(Request.QueryString[null]);
                Parcel m = JsonConvert.DeserializeObject<Parcel>(json);
                StreamClient client = ws.ClientByID(m.client) as StreamClient;
                if (client == null)
                {
                    client = new StreamClient() { Response = Response, clientID = m.client };
                    //client.SessionID = HttpContext.Session.SessionID;
                    ws.AddClient(client);
                    Response.ContentType = "text/event-stream";
                    Response.Headers.Add("Connection", "Keep-Alive");
                }
                else
                {
                    client.Response = Response;
                }

                do
                {
                    if (!ws.SendOne(client).Result)
                    {
                        return null;
                    };
                    Response.Flush();
                    Thread.Sleep(200);
                } while (true);
            }
            catch (Exception ex)
            {

            }
            return null;
        }

        /// <summary>
        /// When the user makes a POST request, using model binidng we pull a 
        /// Message object out of the request and pass it off to MessageCallback
        /// </summary>
        public void Post()
        {
            //var json = Server.UrlDecode(Request.QueryString[null]);
            var rdr = new StreamReader(Request.GetBufferedInputStream());
            var json = rdr.ReadToEnd();
            Parcel m = JsonConvert.DeserializeObject<Parcel>(json);
            Client client = ws.ClientByID(m.client);
            if (client != null)
            {
                client.processParcel(m);
            }
        }

        private static Models.Config.Config config;

        private static void initConfig(HttpServerUtilityBase server)
        {
            if (config == null)
            {
                config = new Models.Config.Config();
                config.ui = JsonConvert.DeserializeObject<Models.Config.UI_Config>(System.IO.File.ReadAllText(server.MapPath("~/App_Data/ui.json")));
                config.scripts = JsonConvert.DeserializeObject<Models.Config.Scripts_Config>(System.IO.File.ReadAllText(server.MapPath("~/App_Data/scripts.json")));
            }
        }

        public ActionResult Setup()
        {
            initConfig(Server);
            var o = new
            {
                ui = JsonConvert.SerializeObject(config.ui, new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore }),
                scripts = JsonConvert.SerializeObject(config.scripts, new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore })
            };
            string ret = JsonConvert.SerializeObject(o, new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore });
            return new ContentResult() { ContentType = "application/json", Content = ret };
        }

        public ActionResult ui()
        {
            initConfig(Server);
            string ret = JsonConvert.SerializeObject(config.ui, new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore });
            return new ContentResult() { ContentType = "application/json", Content = ret };
        }


        public ActionResult scripts()
        {
            initConfig(Server);
            string ret = JsonConvert.SerializeObject(config.scripts, new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore });
            return new ContentResult() { ContentType = "application/json", Content = ret };
        }


        public class LittleFSFile
        {
            [JsonIgnore]
            public string Path;
            public string Name { get; set; }
            public long Size { get; set; }

            public bool dir { get; set; }

            [JsonIgnore]
            public List<LittleFSFile> files;

            public List<LittleFSFile> Dir(string path)
            {
                if (path == null || path == "/" || path == "")
                {
                    return files;
                }
                int i = 0;
                if (path.StartsWith("/")) i = 1;
                var parts = path.Split("/".ToCharArray(), StringSplitOptions.RemoveEmptyEntries);
                List<LittleFSFile> ret = new List<LittleFSFile>();
                if (files != null)
                {
                    foreach (var itm in files)
                    {
                        if (itm.Name == parts[0])
                        {
                            ret.AddRange(itm.Dir(path.Substring(parts[0].Length + i)));
                        }
                    }
                }

                return ret;
            }
        }


        private static LittleFSFile LittleFS;
        private static List<LittleFSFile> InitDir(HttpServerUtilityBase server, string path)
        {
            string baseDir = server.MapPath("~/");
            List<LittleFSFile> ret = new List<LittleFSFile>();
            var dir = new System.IO.DirectoryInfo(path);
            foreach (var file in dir.GetFiles())
            {
                ret.Add(new LittleFSFile() { Path = file.FullName.Replace("\\", "/"), Name = file.Name, Size = file.Length, dir = false });
            }
            foreach (var d in dir.GetDirectories())
            {
                var itm = new LittleFSFile() { Path = d.FullName.Replace("\\", "/"), Name = d.Name, Size = 0, dir = true };
                ret.Add(itm);
                itm.files = InitDir(server, d.FullName);
            }
            foreach (var file in ret)
            {
                file.Path = "/" + file.Path.Substring(baseDir.Length);
            }
            return ret;
        }

        private static void Inif_FS(HttpServerUtilityBase server)
        {
            LittleFS = new LittleFSFile() { Path = "/", Name = "", dir = true };
            string baseDir = server.MapPath("~/");
            LittleFS.files = InitDir(server, baseDir);
        }

        [HttpGet()]
        [ActionName("dir")]
        public ActionResult dir_Get(string path)
        {
            if (LittleFS == null)
            {
                Inif_FS(Server);
            }
            if (path == null) path = "";

            var list = LittleFS.Dir(path);
            string ret = JsonConvert.SerializeObject(list, new JsonSerializerSettings() { NullValueHandling = NullValueHandling.Ignore });
            return new ContentResult() { ContentType = "application/json", Content = ret };
        }

        [HttpPost]
        [ActionName("dir")]
        public ActionResult dir_Post(string path)
        {
            return new ContentResult() { ContentType = "application/json", Content = "OK" };
        }

        [HttpDelete]
        [ActionName("dir")]
        public ActionResult dir_Delete(string path)
        {
            return new ContentResult() { ContentType = "application/json", Content = "OK" };
        }
    }

}
