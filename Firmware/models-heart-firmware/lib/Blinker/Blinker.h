#pragma once

#include <Arduino.h>

class BlinkerItem
{
public:
	int iteration = 0;
	BlinkerItem();
	~BlinkerItem(){};
	BlinkerItem *next = nullptr;
	int pin = 0;
	unsigned long offset = 0;
	int value = 0;
};

class Blinker
{
	BlinkerItem *first = nullptr;
	BlinkerItem *last = nullptr;
	BlinkerItem *current = nullptr;

	String name;
	unsigned long startTime = 0;

protected:
	void (*onWrite)(int pin, int value) = nullptr;

public:
	Print *console = nullptr;
	bool debug = false;
	bool repeat = true;
	int startupState = 0;
	Blinker(String name);
	~Blinker();
	void loop();
	Blinker *Add(int pin, unsigned long offset, int value);
	Blinker *begin()
	{
		current = first;
		startTime = millis();
		return this;
	};
	Blinker *end();
	virtual void write(int pin, int value);
	void printValues();
	BlinkerItem *item(int index);
	bool isRunning() { return startTime != 0; };
	void attachWriteEvent(void (*onWrite)(int pin, int value));
};

class Beeper : public Blinker
{

public:
	Beeper(String name) : Blinker(name) {}
	~Beeper() {}
	virtual void write(int pin, int value);
};

class VirtualBlinker : public Blinker
{

public:
	VirtualBlinker(String name, void (*writeMethode)(int pin, int value)) : Blinker(name)
	{
		this->writeMethode = writeMethode;
	}
	~VirtualBlinker() {}

	void (*writeMethode)(int pin, int value);

	virtual void write(int pin, int value);
};
