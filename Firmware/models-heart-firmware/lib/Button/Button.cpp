//
//
//

#include "Button.h"

void ButtonBase::doPress()
{
	// Serial.printf("press;\n");
	if (press != nullptr)
		press(this);
}

void ButtonBase::doHold()
{
	// Serial.printf("hold;\n");
	if (hold != nullptr)
		hold(this);
}

void ButtonBase::doRelease()
{
	// Serial.printf("release;\n");
	if (release != nullptr)
		release(this);
}

bool ButtonBase::isPressed()
{
	return false;
}

bool ButtonBase::isReleased()
{
	return false;
}

void ButtonBase::handle()
{
	if (!isEnabled)
		return;

	if (pressedTime == 0 && (millis() - releasedTime) > bounce)
	{
		if (isPressed())
		{
			pressedTime = millis();
			releasedTime = 0;
			if (isToggleMode)
			{
				if (isToggled)
				{
					isToggled = false;
					doRelease();
				}
				else
				{
					isToggled = true;
					doPress();
				}
			}
			else
				doPress();
		}
	}
	else if (releasedTime == 0 && (millis() - pressedTime) > bounce)
	{
		if ((millis() - pressedTime) > holdInterval)
		{
			pressedTime = millis();
			if (!isToggleMode)
				doHold();
		}
		if (isReleased())
		{
			pressedTime = 0;
			releasedTime = millis();
			if (!isToggleMode)
				doRelease();
		}
	}
}

void ButtonBase::InitState()
{
	if (isPressed())
	{
		pressedTime = millis();
		releasedTime = 0;
	}
}

Button::Button(int pin, void (*press)(void *sender))
{
	this->pin = pin;
	pinMode(pin, INPUT_PULLUP);
	this->press = press;
}
Button::Button(int pin, void (*press)(void *sender), void (*hold)(void *sender))
{
	this->pin = pin;
	pinMode(pin, INPUT_PULLUP);
	this->press = press;
	this->hold = hold;
}
Button::Button(int pin, void (*press)(void *sender), void (*hold)(void *sender), void (*release)(void *sender))
{
	this->pin = pin;
	pinMode(pin, INPUT_PULLUP);
	this->press = press;
	this->hold = hold;
	this->release = release;
}

bool Button::isPressed()
{
	return (digitalRead(pin) == condition);
}

bool Button::isReleased()
{
	return !(digitalRead(pin) == condition);
}

VirtualButton::VirtualButton(void (*press)(void *sender))
{
	this->bounce = 10;
	this->press = press;
}

VirtualButton::VirtualButton(void (*press)(void *sender), void (*hold)(void *sender))
{
	this->bounce = 10;
	this->press = press;
	this->hold = hold;
}

VirtualButton::VirtualButton(void (*press)(void *sender), void (*hold)(void *sender), void (*release)(void *sender))
{
	this->bounce = 10;
	this->press = press;
	this->hold = hold;
	this->release = release;
}

bool VirtualButton::isPressed()
{
	return value == condition;
}

bool VirtualButton::isReleased()
{
	return value != condition;
}

void VirtualButton::setValue(int value)
{
	this->value = value;
	handle();
}

void VirtualButton::reset()
{
	value = LOW;
	isToggled = false;
	doRelease();
}
