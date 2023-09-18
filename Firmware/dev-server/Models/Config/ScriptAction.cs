using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebUI.Models.Config
{
    public class ScriptAction
    {
        public string type { get; set; }

        public List<ScriptActionPoint> points { get; set; }

    }
}