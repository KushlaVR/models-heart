#include "ui.h"

bool UIElementProperty::load(File *f, int fromStage)
{
    // Serial.println("UIElementProperty::load");
    int stage = fromStage;
    ui->position = f->position();
    int endToken = 0;
    while (f->available())
    {
        int c = f->read();
        // Serial.write(c);

        if (stage == 0) // Property name start
        {
            if (!(ui->isEmptyChar(c))) // not empty
            {
                stage++;
                ui->position = f->position();
                // Serial.print("st 0->1 ");
            }
        }
        if (stage == 1) // Property name start
        {
            if (c == '\'')
            {
                endToken = '\'';
                stage++;
            }
            else if (c == '"')
            {
                endToken = '"';
                stage++;
            }
            else
            {
                endToken = 0;
                name += (char)c;
                stage++;
            }
        }
        else if (stage == 2) // Property name
        {
            if (c != endToken)
            {
                name += (char)c;
            }
            else
            {
                stage++;
                // Serial.print("st 2->name ");
                // Serial.println(name);
                c = ' ';
                ui->position = f->position();
            }
        }
        if (stage == 3) // Property value start
        {
            if (!(ui->isEmptyChar(c)))
            {
                if (c == ':')
                {
                    ui->position = f->position();
                    stage++;
                    c = ' ';
                }
                else
                {
                    ui->loadError = "':' expected";
                    return false;
                }
            }
        }
        if (stage == 4) // Property value
        {
            // if (!(ui->isEmptyChar(c)))
            //{
            if (valuType == UIElementPropertyValueTypes::empty)
            {
                if (c == '\'')
                {
                    endToken = '\'';
                    valuType = UIElementPropertyValueTypes::value;
                    // Serial.println("st 4->value '");
                }
                else if (c == '"')
                {
                    endToken = '"';
                    valuType = UIElementPropertyValueTypes::value;
                    // Serial.println("st 4->value \"");
                }
                else if (c == '{')
                {
                    endToken = 0;
                    valuType = UIElementPropertyValueTypes::object;
                    f->seek(f->position() - 1);
                    UIElement *el = new UIElement();
                    el->ui = ui;
                    object = el;
                    // Serial.println("st 4->object");
                    return el->load(f);
                }
                else if (c == '[')
                {
                    endToken = 0;
                    valuType = UIElementPropertyValueTypes::collection;
                    f->seek(f->position() - 1);
                    UICollection *el = new UICollection();
                    el->ui = ui;
                    collection = el;
                    // Serial.println("st 4->array");
                    return el->load(f);
                }
                else if (!(ui->isEmptyChar(c)))
                {
                    endToken = 0;
                    // Serial.println("st 4->value (empty end token)");
                    valuType = UIElementPropertyValueTypes::value;
                    value += (char)c;
                }
            }
            else
            {
                if (valuType == UIElementPropertyValueTypes::value)
                {
                    if (endToken == 0)
                    {
                        if (c == ',' || c == ']' || c == '}')
                        {
                            stage++;
                            c = ' ';
                            ui->position = f->position();
                            f->seek(f->position() - 1);
                            return true;
                        }
                    }
                    else
                    {
                        if (c == endToken)
                        {
                            stage++;
                            c = ' ';
                            ui->position = f->position();
                            return true;
                        }
                        else
                        {
                            value += (char)c;
                        }
                    }
                }
            }
            //}
        }
        if (stage == 5)
        {
            ui->loadError == "";
            return true;
        }
    }

    if (stage == 0)
    {
        ui->loadError = "Property name expected";
    }
    if (stage == 3)
    {
        ui->loadError = "Unexpected end of JSON string";
    }
    return false;
}

void UIElementProperty::print(Print *p)
{
    if (!(name == ""))
    {
        p->print("\"");
        p->print(name);
        p->print("\"");
        if (valuType != UIElementPropertyValueTypes::empty)
            p->print(":");
    }

    if (valuType == UIElementPropertyValueTypes::value)
    {
        p->print("\"");
        p->print(value);
        p->print("\"");
    }
    else if (valuType == UIElementPropertyValueTypes::object)
    {
        object->print(p);
    }
    else if (valuType == UIElementPropertyValueTypes::collection)
    {
        collection->print(p);
    }
}

bool UICollection::load(File *f)
{
    // Serial.println("UICollection::load");
    int stage = 0;
    int cnt = 0;
    while (f->available())
    {
        int c = f->read();
        // Serial.write(c);
        if (stage == 0)
        {
            if (c == '[')
            {
                stage++;
            }
        }
        else if (stage == 1) // Item
        {
            if (c == ']')
            {
                // Serial.println("End of array");
                return true;
            }
            // Serial.println("try load array item");

            UIElementProperty *el = new UIElementProperty();
            el->ui = ui;
            if (el->load(f, 4))
            {
                add(el);
                stage++;
            }
            else
            {
                ui->loadError = "End of collection not found";
                return false;
            }
        }
        else if (stage == 2) // Separator
        {
            if (c == ']')
            {
                // Serial.println("End of array");
                return true;
            }
            if (c == ',')
            {
                // Serial.println("next item");
                stage = 1;
            }
        }
    }
    ui->loadError = "End of collection not found";
    return false;
}

void UICollection::print(Print *p)
{
    p->print("[");
    Item *itm = getFirst();
    while (itm != nullptr)
    {
        if (itm->Index > 0)
            p->print(",");
        UIElementProperty *el = (UIElementProperty *)itm;
        el->print(p);
        itm = itm->next;
    }
    p->print("]");
}

bool UIElement::load(File *f)
{
    Properties = new Collection();
    while (f->available())
    {
        int c = f->read();
        // Serial.write(c);
        if (c == '{')
        { // begin on object
            while (f->available())
            {
                c = f->read();
                // Serial.write(c);
                if (c == '}') // end of object
                {
                    // Serial.println("End of object");
                    return true;
                }
                else
                {
                    if (!ui->isEmptyChar(c))
                    {
                        if (c == ',')
                        { // separator
                        }
                        else
                        {
                            f->seek(f->position() - 1);
                            UIElementProperty *prop = new UIElementProperty();
                            prop->ui = ui;
                            if (prop->load(f))
                            {
                                Properties->add(prop);
                            }
                            c = 0;
                        }
                    }
                }
            }
        }
        else if (c == '}')
        {
            return true;
        }
    }
    ui->loadError = "End of object not found";
    return false;
}

void UIElement::print(Print *p)
{
    p->print("{");
    Item *itm = Properties->getFirst();
    while (itm != nullptr)
    {
        UIElementProperty *prop = (UIElementProperty *)itm;
        if (itm->Index > 0)
            p->print(",");
        prop->print(p);
        itm = itm->next;
    }
    p->print("}");
}
