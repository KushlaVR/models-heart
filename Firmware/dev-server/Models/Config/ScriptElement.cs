using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebUI.Models.Config
{
    public class ScriptElement
    {
        public string type { get; set; }
        public string cmd { get; set; }
        public List<ScriptAction> actions { get; set; }

    }
}