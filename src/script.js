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

// Bluetooth Serial Setup
let isConnected = false;
const HC06_MAC_ADDRESS = '98:DA:60:0D:8B:28'; // Change this to match your device

document.addEventListener('deviceready', onDeviceReady, false);

function requestBluetoothPermissions() {
  const permissions = window.cordova?.plugins?.permissions;
  if (!permissions) {
    alert('Permissions plugin not available.');
    return;
  }

  const required = [
    permissions.BLUETOOTH,
    permissions.BLUETOOTH_ADMIN,
    permissions.BLUETOOTH_CONNECT,
    permissions.BLUETOOTH_SCAN,
    permissions.ACCESS_FINE_LOCATION
  ];

  permissions.hasPermission(required, (status) => {
    if (!status.hasPermission) {
      permissions.requestPermissions(required, (result) => {
        if (!result.hasPermission) {
          alert('Bluetooth permissions denied. The app may not work properly.');
        } else {
          console.log('All Bluetooth permissions granted.');
        }
      }, (err) => {
        console.error('Request error:', err);
        alert('Error requesting Bluetooth permissions.');
      });
    } else {
      console.log('Permissions already granted.');
    }
  }, (err) => {
    console.error('Check error:', err);
    alert('Error checking Bluetooth permissions.');
  });
}


function onDeviceReady() {
  console.log('Device is ready');
  bluetoothSerial.list((devices) => {
    devices.forEach((device, index) => {
      console.log(`Device ${index + 1}:`);
      console.log(`  Name: ${device.name}`);
      console.log(`  MAC: ${device.id}`);
    });
  }, (err) => {
    console.error("List error:", err);
  });
  

  requestBluetoothPermissions();

  document.getElementById('connect-btn').addEventListener('click', connectToHC06);
  document.getElementById('send-config-btn').addEventListener('click', sendConfigToArduino);

  // Optional: listen for responses from Arduino
  bluetoothSerial.subscribe('\n', (data) => {
    console.log("Received from Arduino:", data);
  });
}

function connectToHC06() {
  bluetoothSerial.connect(
    HC06_MAC_ADDRESS,
    () => {
      isConnected = true;
      alert('Connected to HC-06!');
    },
    () => {
      alert('FAILURE to connectify. Make sure it’s really paired in Android settings.');
    }
  );
}

function sendConfigToArduino() {
  if (!isConnected) {
    alert('Not connected to device!');
    return;
  }

  const alarms = JSON.parse(localStorage.getItem(ALARM_KEY)) || [];
  const dispense = localStorage.getItem(DISPENSE_KEY) || null;

  const payload = {
    alarms: alarms,
    dispense: dispense
  };

  const message = JSON.stringify(payload).trim() + '\n';

  bluetoothSerial.write(message, () => {
    console.log("Sent to Arduino:", message);
    alert('Horarios enviado para o device!');
  }, (err) => {
    console.error("Bluetooth write error:", err);
  });
  
}

// Event listeners for dispense time
dispenseHourSelect.addEventListener('change', saveDispenseTime);
dispenseMinuteSelect.addEventListener('change', saveDispenseTime);

// Initialization
populateTimeSelectors(alarmHourSelect, alarmMinuteSelect);
populateTimeSelectors(dispenseHourSelect, dispenseMinuteSelect);

loadAlarms();
loadDispenseTime();
