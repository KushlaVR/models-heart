#pragma once
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <ESP8266mDNS.h>
#include <FS.h>
#include <LittleFS.h>
#include <Json.h>
#include <WebUIController.h>

class FileServer
{
private:

public:
    FileServer() {}
    ~FileServer() {}

    void setup();


    static void File_Get();
    static void File_Upload();
    static void File_UploadRequest();
    static void File_Delete();
};

extern FileServer fileServer;
