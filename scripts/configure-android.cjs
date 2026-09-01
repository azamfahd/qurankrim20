const fs = require('fs');
const path = require('path');

function configureAndroid() {
  const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('AndroidManifest.xml not found at:', manifestPath);
    return;
  }

  let manifestContent = fs.readFileSync(manifestPath, 'utf8');

  // Permissions to inject
  const permissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.RECORD_AUDIO',
    'android.permission.MODIFY_AUDIO_SETTINGS',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.SCHEDULE_EXACT_ALARM',
    'android.permission.USE_EXACT_ALARM',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.WAKE_LOCK',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    'android.permission.VIBRATE'
  ];

  // 1. Ensure tools namespace exists on <manifest>
  if (!manifestContent.includes('xmlns:tools=')) {
    manifestContent = manifestContent.replace(
      '<manifest',
      '<manifest xmlns:tools="http://schemas.android.com/tools"'
    );
  }

  // 2. Add permissions cleanly before <application
  const existingPermissions = manifestContent.match(/<uses-permission[^>]+>/g) || [];
  const permissionsToAdd = permissions.filter(perm => !manifestContent.includes(`"${perm}"`));

  if (permissionsToAdd.length > 0) {
    const permissionTags = permissionsToAdd
      .map(p => `    <uses-permission android:name="${p}" />`)
      .join('\n');
    
    manifestContent = manifestContent.replace(
      '<application',
      `${permissionTags}\n\n    <application`
    );
  }

  // 3. Add application attributes safely
  if (!manifestContent.includes('android:usesCleartextTraffic')) {
    manifestContent = manifestContent.replace(
      '<application',
      '<application android:usesCleartextTraffic="true" android:hardwareAccelerated="true"'
    );
  }

  // 4. Ensure deep link intent-filter inside MainActivity
  if (!manifestContent.includes('android:scheme="com.anisalqulub.app"')) {
    // Remove old scheme if present
    manifestContent = manifestContent.replace(/<intent-filter[\s\S]*?android:scheme="com\.anis\.qulub"[\s\S]*?<\/intent-filter>/g, '');

    const intentFilter = `
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.anisalqulub.app" android:host="auth" />
            </intent-filter>`;
    
    // Insert before closing tag of MainActivity </activity>
    manifestContent = manifestContent.replace('</activity>', `${intentFilter}\n        </activity>`);
  }

  fs.writeFileSync(manifestPath, manifestContent, 'utf8');
  console.log('✅ AndroidManifest.xml successfully configured with all required permissions and flags.');

  // 5. Remove Splash Screen drawable & update styles to prevent duplicate splash image
  try {
    const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
    if (fs.existsSync(resDir)) {
      // Clean splash drawables
      const drawables = fs.readdirSync(resDir);
      for (const d of drawables) {
        if (d.startsWith('drawable')) {
          const dPath = path.join(resDir, d);
          const splashFiles = ['splash.png', 'splash.xml', 'splash.webp'];
          for (const sf of splashFiles) {
            const spPath = path.join(dPath, sf);
            if (fs.existsSync(spPath)) {
              fs.unlinkSync(spPath);
              console.log(`🗑️ Removed native splash file: ${spPath}`);
            }
          }
        }
      }

      // Update styles.xml to use transparent/clean background instead of @drawable/splash
      const stylesFiles = [
        path.join(resDir, 'values', 'styles.xml'),
        path.join(resDir, 'values-night', 'styles.xml')
      ];

      for (const sPath of stylesFiles) {
        if (fs.existsSync(sPath)) {
          let sContent = fs.readFileSync(sPath, 'utf8');
          sContent = sContent.replace(/<item name="android:background">@drawable\/splash<\/item>/g, '<item name="android:windowBackground">#022c22</item>');
          sContent = sContent.replace(/<item name="android:windowBackground">@drawable\/splash<\/item>/g, '<item name="android:windowBackground">#022c22</item>');
          fs.writeFileSync(sPath, sContent, 'utf8');
          console.log(`✅ Updated styles at: ${sPath}`);
        }
      }
    }
  } catch (splashErr) {
    console.warn('Splash cleanup notice:', splashErr);
  }
}

try {
  configureAndroid();
} catch (err) {
  console.error('Error configuring Android project:', err);
  process.exit(1);
}
