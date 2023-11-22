#pragma once

#include <Collection.h>
#include <Json.h>
#include <WiFiClient.h>
#include <WebUIController.h>

class Joypadfield : public Item
{
public:
	String name;
	double value = 0.0;
	double sent = 0.0;

	Joypadfield(String name);
	~Joypadfield(){};

	bool changed() { return value != sent; }
};

class Joypad : public Item
{
public:
	Joypad();
	~Joypad(){};

	int id;
	IPAddress clientIP;
	WiFiClient client;
	unsigned long report = 0;
	unsigned long responce = 0;


	Collection *fields = nullptr;

	bool keepAlive();

	bool processFieldsFormat(JsonString *json);
	bool processParcel(JsonString *json);
	bool sendValues();

	bool changed();
};

class JoypadCollection : public Collection
{
private:
	Collection *fields = nullptr;

public:
	JoypadCollection();
	~JoypadCollection(){};

	unsigned long keepAliveInterval = 5000;
	unsigned long reportAliveInterval = 500;

	Joypad *getById(int id);
	void updateValuesFrom(Joypad *source);
	void populateValuesTo(Joypad *source);
	void setValue(String name, double value);
	double getValue(String name);
	bool setValue(Collection *fields, String name, double value);
	void loop();
	Joypadfield *getFirstField()
	{
		if (fields == nullptr)
			return nullptr;
		return (Joypadfield *)(fields->getFirst());
	}
};
