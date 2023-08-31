#pragma once

#include <Arduino.h>
#include <Collection.h>
#include <FS.h>
#include <Print.h>

class UI;
class UIElement;
class UICollection;

enum UIElementPropertyValueTypes
{
    empty = 0,
    value = 1,
    object = 2,
    collection = 3
};

class UIElementProperty : public Item
{
public:
    UI *ui = nullptr;
    UIElementProperty() {}
    ~UIElementProperty() {}
    String name = "";

    UIElementPropertyValueTypes valuType = UIElementPropertyValueTypes::empty;

    String value = "";
    UICollection *collection = nullptr;
    UIElement *object = nullptr;

    bool load(File *f, int fromStage = 0);
    void print(Print * p);
};

class UICollection : public Collection
{
public:
    UI *ui = nullptr;
    UICollection() {}
    ~UICollection() {}

    bool load(File *f);
    void print(Print * p);
};

class UIElement : public Item
{
    Collection *Properties = nullptr;

public:
    UI *ui = nullptr;
    UIElement() {}
    ~UIElement() {}

    bool load(File *f);
    void print(Print *p);
};

class UI
{
    UIElement *root = nullptr;

public:
    UI() {}
    ~UI() {}

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
        root = new UIElement();
        root->ui = this;
        root->load(f);
    }

    void print(Print *p)
    {
        root->print(p);
    }
};