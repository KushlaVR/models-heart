using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebUI.Models.Config
{
    public class Config
    {
        public UI_Config ui { get; set; }
        public Scripts_Config scripts { get; set; }

    }
}