---
title: A local smart home
description: Connect sensors, automations, cameras, and voice tools while keeping control and privacy in view.
order: 9
---

A smart home can help with routine tasks, but each connected device adds complexity. A local setup aims to keep control and processing on your own network where possible. “Local” does not automatically mean private: devices, integrations, and remote access can still send data elsewhere. Check how each component works before you connect it.

## A hub and radio protocols

Home Assistant is a home-automation platform that can bring compatible devices and automations into one interface. Its integrations connect devices using different methods, including local network APIs and cloud services. Check a device's integration details before buying it; a product marked “works with” may rely on an account or service you would rather avoid.

Zigbee and Z-Wave are low-power wireless protocols used by many sensors and switches. They typically need a compatible coordinator or radio connected to the controller, and devices must be paired and supported. Matter is a newer smart-home standard designed for interoperability across ecosystems, but real-world support still varies by device type, controller, and firmware. Check compatibility lists and update requirements rather than assuming one protocol covers everything.

MQTT is a lightweight messaging protocol often used to pass events between devices and software. A broker such as Mosquitto receives and distributes these messages. Zigbee2MQTT can bridge supported Zigbee devices to MQTT, while Home Assistant can consume the messages. Protect the broker with authentication and network restrictions; an exposed broker can allow others to read or publish messages.

## Cameras and voice

Frigate is software for local network video recording and object detection. Camera streams can consume substantial bandwidth and storage, so size retention based on the number of cameras, video settings, and how long footage should be kept. Secure camera credentials and avoid making camera interfaces publicly reachable. Be especially thoughtful about consent and local recording laws when cameras capture other people or shared spaces.

Local voice systems combine wake-word detection, speech recognition, and text-to-speech components. Processing speech locally may reduce reliance on a cloud service, but microphones still collect audio and models vary in capability. Test recognition quality in your environment and make clear when voice controls are listening. Keep physical mute controls where possible.

## Build in small steps

Start with one light or sensor and one useful automation. Make it easy to disable the automation if a sensor misbehaves. Then add devices gradually and keep a written inventory: protocol, room, power source, and how to reset or replace it. A backup of Home Assistant configuration helps after a system failure, but it does not restore failed hardware by itself.

For cameras, begin with a single camera and review storage use. For voice, test the full chain without connecting it to sensitive actions. Avoid automations that could create unsafe conditions without a manual override.

<aside class="on-sol" aria-label="On SOL">
<p><strong>On SOL</strong></p>
<p>SOL's smart home runs locally: Home Assistant as the hub; Zigbee2MQTT, Z-Wave JS UI, and Matter Server for devices; Mosquitto as the MQTT broker; Node-RED for automations that outgrow simple rules; Frigate for cameras; and Wyoming for local voice.</p>
</aside>

## Next steps

- Check Home Assistant's integration list before choosing devices.
- Choose one protocol and a compatible coordinator before buying a large set of sensors.
- Secure MQTT and camera access; avoid public exposure.
- Test each automation with a manual fallback and keep configuration backups.

## Official documentation

- [Home Assistant documentation](https://www.home-assistant.io/docs/)
- [Zigbee2MQTT documentation](https://www.zigbee2mqtt.io/)
- [Z-Wave JS documentation](https://zwave-js.github.io/zwave-js-ui/)
- [Matter documentation](https://csa-iot.org/all-solutions/matter/)
- [Mosquitto documentation](https://mosquitto.org/documentation/)
- [Frigate documentation](https://docs.frigate.video/)
- [Wyoming protocol](https://github.com/rhasspy/wyoming)
- [Node-RED documentation](https://nodered.org/docs/)
