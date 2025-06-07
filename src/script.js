// Import BleClient from the BLE plugin
import { BleClient } from '@capacitor-community/bluetooth-le';

// ALARM TIME ELEMENTS
const alarmForm = document.getElementById('alarm-form');
const alarmHourSelect = document.getElementById('alarm-hour-select');
const alarmMinuteSelect = document.getElementById('alarm-minute-select');
const alarmList = document.getElementById('alarm-list');
const clearAlarmsBtn = document.getElementById('clear-alarms');

// DISPENSING TIME ELEMENTS
const dispenseHourSelect = document.getElementById('dispense-hour-select');
const dispenseMinuteSelect = document.getElementById('dispense-minute-select');

// STORAGE KEYS
const ALARM_KEY = 'alarmTimes';
const DISPENSE_KEY = 'dispenseTime';

// BLE Service and Characteristic UUIDs (adjust these based on your device)
const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; // Nordic UART Service UUID
const NORDIC_UART_TX_CHARACTERISTIC = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // TX Characteristic UUID

function pad(num) {
  return num.toString().padStart(2, '0');
}

function populateTimeSelectors(hourSel, minuteSel) {
  for (let h = 0; h < 24; h++) {
    const option = document.createElement('option');
    option.value = pad(h);
    option.textContent = pad(h);
    hourSel.appendChild(option);
  }

  for (let m = 0; m < 60; m += 5) {
    const option = document.createElement('option');
    option.value = pad(m);
    option.textContent = pad(m);
    minuteSel.appendChild(option);
  }
}

// Load and render alarm times
function loadAlarms() {
  const times = JSON.parse(localStorage.getItem(ALARM_KEY)) || [];
  alarmList.innerHTML = '';

  times.forEach((time, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${time}
      <button onclick="deleteAlarm(${index})">Remove</button>
    `;
    alarmList.appendChild(li);
  });
}

// Add new alarm time
alarmForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const hour = alarmHourSelect.value;
  const minute = alarmMinuteSelect.value;
  const time = `${hour}:${minute}`;

  let times = JSON.parse(localStorage.getItem(ALARM_KEY)) || [];

  if (times.includes(time)) return;

  times.push(time);
  localStorage.setItem(ALARM_KEY, JSON.stringify(times));
  loadAlarms();
});

// Delete a specific alarm
function deleteAlarm(index) {
  let times = JSON.parse(localStorage.getItem(ALARM_KEY)) || [];
  times.splice(index, 1);
  localStorage.setItem(ALARM_KEY, JSON.stringify(times));
  loadAlarms();
}

// Clear all alarms
clearAlarmsBtn.addEventListener('click', () => {
  localStorage.removeItem(ALARM_KEY);
  loadAlarms();
});

// Handle dispensing time
function loadDispenseTime() {
  const stored = localStorage.getItem(DISPENSE_KEY);
  if (stored) {
    const [hour, minute] = stored.split(':');
    dispenseHourSelect.value = hour;
    dispenseMinuteSelect.value = minute;
  }
}

function saveDispenseTime() {
  const hour = dispenseHourSelect.value;
  const minute = dispenseMinuteSelect.value;
  const time = `${hour}:${minute}`;
  localStorage.setItem(DISPENSE_KEY, time);
}

// Ensure Cordova/Capacitor is ready
document.addEventListener ('deviceready', onDeviceReady, false);

function onDeviceReady() {
  console.log('Device is ready');

  // Bind connect and send buttons
  document.getElementById('connect-btn').addEventListener('click', connectToHC06);
  document.getElementById('send-config-btn').addEventListener('click', sendConfigToArduino);
}

// Connect to BLE device
async function connectToHC06() {
  try {
    // Check if Bluetooth is enabled
    const isEnabled = await BleClient.isEnabled();
    if (!isEnabled) {
      alert('Please enable Bluetooth.');
      return;
    }

    // Initialize BLE client
    await BleClient.initialize();

    // Request a device with the specified service and name prefix
    const device = await BleClient.requestDevice({
      services: [NORDIC_UART_SERVICE],
      namePrefix: 'HC-06' // Adjust if your BLE device's name differs
    });

    // Connect to the selected device
    await BleClient.connect(device.deviceId);
    alert('Connected to device!');
    
    // Store the device ID for later use
    window.connectedDeviceId = device.deviceId;
  } catch (err) {
    console.error('Bluetooth error:', err);
    alert('Failed to connect: ' + err.message);
  }
}

// Send config data to Arduino via BLE
async function sendConfigToArduino() {
  if (!window.connectedDeviceId) {
    alert('Please connect to the device first.');
    return;
  }

  const alarms = JSON.parse(localStorage.getItem(ALARM_KEY)) || [];
  const dispense = localStorage.getItem(DISPENSE_KEY) || null;

  const payload = {
    alarms: alarms,
    dispense: dispense
  };

  const message = JSON.stringify(payload) + '\n';
  // message formatting: {"alarms":["05:00"],"dispense":"01:20"}

  try {
    await BleClient.write(
      window.connectedDeviceId,
      NORDIC_UART_SERVICE,
      NORDIC_UART_TX_CHARACTERISTIC,
      message
    );
    alert('Config sent!');
  } catch (err) {
    console.error('Bluetooth write error:', err);
    alert('Failed to send config.');
  }
}

// Event listeners for dispense time
dispenseHourSelect.addEventListener('change', saveDispenseTime);
dispenseMinuteSelect.addEventListener('change', saveDispenseTime);

// Initialization
populateTimeSelectors(alarmHourSelect, alarmMinuteSelect);
populateTimeSelectors(dispenseHourSelect, dispenseMinuteSelect);

loadAlarms();
loadDispenseTime();