using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebUI.Models.Config
{
    public class UIElement
    {
        public string type {  get; set; }
        public int? x { get; set; }
        public int? y { get; set; }
        public int? w { get; set; }
        public int? h { get; set; }
        public string text { get; set; }
        public string cmd { get; set; }
        public string autocenter { get; set; }

    }
}