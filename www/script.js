
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

async function ensureBluetoothPermissions() {
  try {
    const granted = await BluetoothSerial.requestPermissions();
    console.log('[Permissions] Bluetooth permissions granted:', granted);
  } catch (err) {
    console.error('[Permissions] Bluetooth permission error:', err);
    alert('Bluetooth permissions are required to connect to the device.');
  }
}


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

function requestBluetoothPermissions() {
  if (device.platform === 'Android') {
    const sdkInt = parseInt(device.version.split('.')[0]);
    if (sdkInt >= 12) {
      cordova.plugins.diagnostic.requestRuntimePermissions(function(statuses) {
        console.log("Bluetooth permissions:", statuses);
      }, function(error) {
        console.error("Permission error:", error);
      }, [
        cordova.plugins.diagnostic.permission.BLUETOOTH_CONNECT,
        cordova.plugins.diagnostic.permission.ACCESS_FINE_LOCATION
      ]);
    }
  }
}

let hc06Address = null;

// Ensure Cordova is ready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  console.log('Device is ready');

  // Bind connect and send buttons
  document.getElementById('connect-btn').addEventListener('click', connectToHC06);
  document.getElementById('send-config-btn').addEventListener('click', sendConfigToArduino);

  // Optional: request Bluetooth permissions here if Android 12+
}

// Connect to paired HC-06
async function connectToHC06() {
  try {
    await window.BluetoothSerial.requestPermissions();
    await window.BluetoothSerial.connect({ address: '98:DA:60:0D:8B:28' });
    alert('Connected to HC-06!');
  } catch (err) {
    console.error('Bluetooth error:', err);
    alert('Failed to connect: ' + err.message);
  }
}



// async function connectToHC06() {
//   try {
//     await window.BluetoothSerial.requestPermissions();
//     await window.BluetoothSerial.connect({ address: '98:DA:60:0D:8B:28' });
//     alert('Connected to HC-06!');
//   } catch (err) {
//     console.error('Bluetooth error:', err);
//     alert('Failed to connect: ' + err.message);
//   }
// }


// function connectToHC06() {
//   bluetoothSerial.list(
//     function(devices) {
//       const hc06 = devices.find(d => d.name === 'HC-06');
//       if (hc06) {
//         hc06Address = hc06.id;
//         bluetoothSerial.connectInsecure(hc06Address, () => {
//           alert('Connected to HC-06!');
//         }, () => {
//           alert('Connection failed.');
//         });
//       } else {
//         alert('HC-06 not found. Make sure it is paired via Bluetooth settings.');
//       }
//     },
//     (err) => {
//       console.error('Bluetooth list error:', err);
//     }
//   );
// }

// Send config data to Arduino via HC-06
function sendConfigToArduino() {
  if (!hc06Address) {
    alert('Please connect to HC-06 first.');
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

  bluetoothSerial.write(message, () => {
    alert('Config sent!');
  }, (err) => {
    console.error('Bluetooth write error:', err);
    alert('Failed to send config.');
  });
}

dispenseHourSelect.addEventListener('change', saveDispenseTime);
dispenseMinuteSelect.addEventListener('change', saveDispenseTime);

// Initialization
populateTimeSelectors(alarmHourSelect, alarmMinuteSelect);
populateTimeSelectors(dispenseHourSelect, dispenseMinuteSelect);

loadAlarms();
loadDispenseTime();
