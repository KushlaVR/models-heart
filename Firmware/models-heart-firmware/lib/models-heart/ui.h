#pragma once

#include <Arduino.h>
#include <Collection.h>
#include <FS.h>
#include <Print.h>

class JsonObject;
class JsonElement;
class JsonCollection;

enum JsonElementPropertyValueTypes
{
    empty = 0,
    value = 1,
    object = 2,
    collection = 3
};

class JsonElementProperty : public Item
{
public:
    JsonObject *ui = nullptr;
    JsonElementProperty() {}
    ~JsonElementProperty() {}
    String name = "";

    JsonElementPropertyValueTypes valuType = JsonElementPropertyValueTypes::empty;

    String value = "";
    JsonCollection *collection = nullptr;
    JsonElement *object = nullptr;

    bool load(File *f, int fromStage = 0);
    void print(Print * p);
};

class JsonCollection : public Collection
{
public:
    JsonObject *ui = nullptr;
    JsonCollection() {}
    ~JsonCollection() {}

    bool load(File *f);
    void print(Print * p);
};

class JsonElement : public Item
{
    Collection *Properties = nullptr;

public:
    JsonObject *ui = nullptr;
    JsonElement() {}
    ~JsonElement() {}

    bool load(File *f);
    void print(Print *p);
};

class JsonObject
{
    JsonElement *root = nullptr;

public:
    JsonObject() {}
    ~JsonObject() {}

    String loadError = "";
    int position = 0;

    bool isEmptyChar(int c)
    {
        return (c == 10 || c == 13 || c == 9 || c == ' ');
    }

    void load(File *f)
    {
        f->seek(0);
        position = 0;
        root = new JsonElement();
        root->ui = this;
        root->load(f);
    }

    void print(Print *p)
    {
        root->print(p);
    }
};