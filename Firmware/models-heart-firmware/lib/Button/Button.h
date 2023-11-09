#pragma once
// Button.h
#include <Arduino.h>

class ButtonBase
{
protected:
	unsigned long pressedTime = 0;
	unsigned long releasedTime = 0;
	void (*press)(void * sender) = nullptr;
	void (*hold)(void * sender) = nullptr;
	void (*release)(void * sender) = nullptr;

	virtual void doPress();
	virtual void doHold();
	virtual void doRelease();

public:
	// Debounce interval
	int bounce = 200;
	bool isEnabled = true;
	bool isToggleMode = false;
	bool isToggled = false;
	void * tag = nullptr;

	// Time before hold event triggered
	unsigned long holdInterval = 2000;
	virtual bool isPressed();
	virtual bool isReleased();
	virtual void handle();
	virtual void InitState(); 
};

class Button : public ButtonBase
{
private:
	int pin;

public:
	int condition = 1;
	Button(int pin, void (*press)(void * sender));
	Button(int pin, void (*press)(void * sender), void (*hold)(void * sender));
	Button(int pin, void (*press)(void * sender), void (*hold)(void * sender), void (*release)(void * sender));
	bool isPressed() override;
	bool isReleased() override;
};

class VirtualButton : public ButtonBase
{
private:
	int value;

public:
	int condition = HIGH;
	VirtualButton(void (*press)(void * sender));
	VirtualButton(void (*press)(void * sender), void (*hold)(void * sender));
	VirtualButton(void (*press)(void * sender), void (*hold)(void * sender), void (*release)(void * sender));
	bool isPressed() override;
	bool isReleased() override;
	void setValue(int value);
	void reset();
};
