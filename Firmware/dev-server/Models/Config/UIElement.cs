using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebUI.Models.Config
{
    public class UIElement
    {
        public string type {  get; set; }
        public decimal? x { get; set; }
        public decimal? y { get; set; }
        public decimal? w { get; set; }
        public decimal? h { get; set; }
        public string text { get; set; }
        public string cmd { get; set; }
        public string src { get; set; }
        public string autocenter { get; set; }

    }
}