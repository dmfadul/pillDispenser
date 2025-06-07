// ... all previous code remains unchanged ...

// Request Bluetooth permissions on Android 12+
async function requestBluetoothPermissions() {
  if (window.cordova && device.platform === 'Android') {
    const sdkInt = parseInt(device.version.split('.')[0], 10);
    if (sdkInt >= 12) {
      console.log('Requesting Android 12+ Bluetooth permissions');
      cordova.plugins.diagnostic.requestRuntimePermissions(
        function (statuses) {
          console.log('Permission statuses:', statuses);
        },
        function (error) {
          console.error('Bluetooth permission error:', error);
        },
        [
          cordova.plugins.diagnostic.permission.BLUETOOTH_CONNECT,
          cordova.plugins.diagnostic.permission.BLUETOOTH_SCAN,
          cordova.plugins.diagnostic.permission.ACCESS_FINE_LOCATION
        ]
      );
    }
  }
}

let hc06Address = null;

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  console.log('Device ready');
  requestBluetoothPermissions();

  document.getElementById('connect-btn').addEventListener('click', connectToHC06);
  document.getElementById('send-config-btn').addEventListener('click', sendConfigToArduino);
}

// Connect to paired HC-06
function connectToHC06() {
  bluetoothSerial.list(
    function (devices) {
      console.log('Paired devices:', devices);

      const hc06 = devices.find(d => d.name === 'HC-06' || d.id?.startsWith('98:D3:'));

      if (hc06) {
        hc06Address = hc06.id;
        console.log('Connecting to HC-06 at:', hc06Address);

        bluetoothSerial.connectInsecure(
          hc06Address,
          () => {
            alert('✅ Connected to HC-06!');
            console.log('Bluetooth connection established.');
          },
          () => {
            alert('⚠️ Connection failed. Try restarting the app and check if HC-06 is paired.');
          }
        );
      } else {
        alert('🔍 HC-06 not found. Make sure it is paired via your phone\'s Bluetooth settings and that location services are enabled.');
      }
    },
    function (err) {
      console.error('Failed to list Bluetooth devices:', err);
      alert('❌ Could not list Bluetooth devices. Check Bluetooth status and permissions.');
    }
  );
}

// Send config data to Arduino
function sendConfigToArduino() {
  if (!hc06Address) {
    alert('🔌 Please connect to HC-06 first.');
    return;
  }

  const alarms = JSON.parse(localStorage.getItem(ALARM_KEY)) || [];
  const dispense = localStorage.getItem(DISPENSE_KEY) || null;

  const payload = { alarms, dispense };
  const message = JSON.stringify(payload) + '\n';

  console.log('Sending message:', message);

  bluetoothSerial.write(
    message,
    () => {
      alert('📤 Config sent to Arduino successfully!');
    },
    (err) => {
      console.error('Bluetooth write error:', err);
      alert('❌ Failed to send config. Check connection.');
    }
  );
}

// ... rest of the code (selectors, localStorage setup) remains unchanged ...
