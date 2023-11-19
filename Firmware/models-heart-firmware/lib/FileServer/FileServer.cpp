#include "FileServer.h"

static File fsUploadFile;

void FileServer::setup()
{
    webServer.on("/api/dir", HTTPMethod::HTTP_GET, File_Get);
    webServer.on(
        "/api/dir", HTTP_POST, // if the client posts to the upload page
        File_UploadRequest,    // Send status 200 (OK) to tell the client we are ready to receive
        File_Upload            // Receive and save the file
    );
    webServer.on("/api/dir", HTTPMethod::HTTP_DELETE, File_Delete);
}

void FileServer::File_Get()
{
    if (webServer.hasArg("path"))
    {
        String path = webServer.arg("path");
        Serial.print("Dir Name: ");
        Serial.print(path);
        Dir dir = LittleFS.openDir(path);
        JsonString ret = "[";
        while (dir.next())
        {
            ret.beginObject();
            // get filename
            ret.AddValue("Name", dir.fileName());
            Serial.print(dir.fileName());
            Serial.print(" - ");
            // If element have a size display It else write 0
            if (dir.fileSize())
            {
                File f = dir.openFile("r");
                Serial.println(f.size());
                ret.AddValue("Size", String(f.size()));
                f.close();
                ret.AddValue("dir", "0");
            }
            else
            {
                Serial.println("0");
                ret.AddValue("dir", "1");
            }

            ret.endObject();
        }

        ret.endArray();
        webServer.send(200, "application/json", ret);
    }
    webServer.send(500, "text/plain", "500: undefinded path");
}

void FileServer::File_Upload()
{

    HTTPUpload &upload = webServer.upload();
    if (upload.status == UPLOAD_FILE_START)
    {
        // upload.totalSize
        FSInfo info;
        if (LittleFS.info(info))
        {
            int freeSpace = (info.totalBytes - info.usedBytes);
            if (upload.contentLength > freeSpace)
            {
                Serial.println("500: Out of memory");
                webServer.send(500, "text/plain", "500: Out of memory");
                return;
            }
            else
            {
                String path = "/";
                if (webServer.hasArg("path"))
                {
                    path = webServer.arg("path");
                    Serial.print("Dir Name: ");
                    Serial.println(path);
                }
                String filename = path + upload.filename;
                if (!filename.startsWith("/"))
                    filename = "/" + filename;
                Serial.print("handleFileUpload Name: ");
                Serial.println(filename);
                fsUploadFile = LittleFS.open(filename, "w"); // Open the file for writing in SPIFFS (create if it doesn't exist)
                filename = String();
            }
        }
    }
    else if (upload.status == UPLOAD_FILE_WRITE)
    {
        Serial.print("handleFileUpload write: ");
        Serial.println(upload.currentSize);
        if (fsUploadFile)
        {
            FSInfo info;
            if (LittleFS.info(info))
            {
                int freeSpace = (info.totalBytes - info.usedBytes);
                if (upload.currentSize > freeSpace)
                {
                    fsUploadFile.close();
                    Serial.println("500: Out of memory");
                    webServer.send(500, "text/plain", "500: Out of memory");
                }
                else
                {
                    size_t sz = fsUploadFile.write(upload.buf, upload.currentSize); // Write the received bytes to the file
                    if (upload.currentSize != sz)
                    {
                        Serial.println("500: couldn't create file");
                        webServer.send(500, "text/plain", "500: couldn't create file");
                    }
                }
            }
        }
    }
    else if (upload.status == UPLOAD_FILE_END)
    {
        if (fsUploadFile)
        {                         // If the file was successfully created
            fsUploadFile.close(); // Close the file again
            Serial.print("handleFileUpload Size: ");
            Serial.println(upload.totalSize);
            webServer.send(200);
        }
        else
        {
            webServer.send(500, "text/plain", "500: couldn't create file");
        }
    }
}

void FileServer::File_UploadRequest()
{
    if (fsUploadFile){
        fsUploadFile.close();
    }
    HTTPUpload &upload = webServer.upload();
    FSInfo info;
    if (LittleFS.info(info) && (&upload != nullptr))
    {
        int freeSpace = (info.totalBytes - info.usedBytes);
        if (upload.currentSize > freeSpace)
        {
            Serial.println("500: Out of memory");
            webServer.send(500, "text/plain", "500: Out of memory");
        }
        return;
    }
    webServer.send(200);
}

void FileServer::File_Delete()
{
    if (webServer.hasArg("path"))
    {
        String path = webServer.arg("path");
        Serial.print("Dir Name: ");
        Serial.print(path);
        if (LittleFS.exists(path))
        {
            LittleFS.remove(path);
            webServer.send(200);
            return;
        }
        webServer.send(500, "text/plain", "500: file dosn't exists");
    }
    webServer.send(500, "text/plain", "500: undefinded path");
}

FileServer fileServer;