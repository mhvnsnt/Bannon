package com.bannon.game;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;

/**
 * BANNON — native Android shell around the physics-wrestling web game.
 * The full game (BANNON_v150.html) is bundled in assets and loaded locally, so it launches instantly
 * and its saves (localStorage: CAW/DNA, movesets, chosen models) persist under one stable app origin.
 * The AAA fighter models stream from the GitHub raw CDN on demand (INTERNET permission).
 *
 * This is the WebView APK path (no Unreal build needed) — a real installable app the owner can download
 * from CI and sideload. The native UE C++ build is a separate, heavier target (see docs/MOBILE_INSTALL.md).
 */
public class MainActivity extends AppCompatActivity {

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // keep the screen on during a match; go fullscreen (immersive) like a real game
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);            // localStorage for saves
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        web.setWebChromeClient(new WebChromeClient());   // lets WebGL/console behave like a browser
        WebView.setWebContentsDebuggingEnabled(true);

        // BannonNative bridge — lets the OTA updater (BANNON_v150.html) read the TRUE installed apk
        // build (survives content hot-swaps, unlike an HTML constant) and open the APK download when a
        // native reinstall is genuinely needed.
        web.addJavascriptInterface(new NativeBridge(), "BannonNative");

        // NATIVE-OWNED OTA: load the newest game we actually have on disk.
        // The JS updater used to cache the ~2.7MB game HTML in localStorage, but Android WebView caps
        // localStorage near 5MB per origin, so the write threw, the swap only survived that session, and
        // the next launch booted the stale bundled build and asked to update AGAIN — every single time.
        // Native storage has no such limit, so the update lives in filesDir and is simply loaded here.
        web.loadUrl(newestGameUrl());

        // then look for a newer build in the background, ready for the next launch
        checkForUpdate();

        goImmersive();
    }

    private void goImmersive() {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) goImmersive();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    // ── NATIVE OTA ───────────────────────────────────────────────────────────────────────────────
    private static final String RAW = "https://raw.githubusercontent.com/mhvnsnt/Bannon/main/dist/";
    private File updateFile() { return new File(getFilesDir(), "bannon_update.html"); }
    private File stampFile()  { return new File(getFilesDir(), "bannon_update.build"); }

    /** The build number of the downloaded update, or 0 if there isn't one. */
    private int storedBuild() {
        try {
            if (!stampFile().exists() || !updateFile().exists()) return 0;
            BufferedReader r = new BufferedReader(new FileReader(stampFile()));
            String line = r.readLine(); r.close();
            return line == null ? 0 : Integer.parseInt(line.trim());
        } catch (Exception e) { return 0; }
    }

    /** Load the downloaded build when it is newer than the one baked into this APK. */
    private String newestGameUrl() {
        try {
            int stored = storedBuild();
            if (stored > 0 && stored > apkBuild() && updateFile().length() > 800000) {
                return "file://" + updateFile().getAbsolutePath();
            }
        } catch (Exception e) { /* fall through to the bundled copy */ }
        return "file:///android_asset/index.html";
    }

    private int apkBuild() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; }
        catch (Exception e) { return 0; }
    }

    /**
     * Fetch dist/version.json; if it names a newer CONTENT build than we have, download
     * dist/BANNON.html into filesDir. Applied on the next launch — silently, with no prompt, because a
     * real game updates itself instead of asking permission every time it opens.
     */
    private void checkForUpdate() {
        new Thread(new Runnable() { public void run() {
            try {
                String vj = httpGet(RAW + "version.json");
                if (vj == null) return;
                int remote = jsonInt(vj, "build");
                int have = Math.max(apkBuild(), storedBuild());
                if (remote <= have) return;

                String html = httpGet(RAW + "BANNON.html");
                // same sanity gate as the JS path: big enough, carries the build hook, closes cleanly.
                if (html == null || html.length() < 800000
                        || !html.contains("BANNON_BUILD") || !html.trim().endsWith("</html>")) return;

                // write to a temp file first so a failed download can never leave a half-written game
                File tmp = new File(getFilesDir(), "bannon_update.tmp");
                FileOutputStream fo = new FileOutputStream(tmp);
                fo.write(html.getBytes("UTF-8")); fo.flush(); fo.close();
                if (tmp.length() < 800000) { tmp.delete(); return; }
                if (updateFile().exists()) updateFile().delete();
                if (!tmp.renameTo(updateFile())) { tmp.delete(); return; }

                FileOutputStream so = new FileOutputStream(stampFile());
                so.write(String.valueOf(remote).getBytes("UTF-8")); so.flush(); so.close();

                final int applied = remote;
                runOnUiThread(new Runnable() { public void run() {
                    try {
                        if (web != null) web.evaluateJavascript(
                            "window.__BANNON_UPDATE_READY=" + applied + ";" +
                            "try{if(window.BANNON_OTA_NOTIFY)window.BANNON_OTA_NOTIFY(" + applied + ");}catch(e){}", null);
                    } catch (Exception e) { /* no-op */ }
                }});
            } catch (Exception e) { /* offline or blocked — try again next launch */ }
        }}).start();
    }

    private String httpGet(String url) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(12000); c.setReadTimeout(30000);
            c.setRequestProperty("Cache-Control", "no-cache");
            if (c.getResponseCode() != 200) return null;
            BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"));
            StringBuilder sb = new StringBuilder(); String line;
            while ((line = r.readLine()) != null) sb.append(line).append('\n');
            r.close();
            return sb.toString();
        } catch (Exception e) { return null; }
        finally { if (c != null) c.disconnect(); }
    }

    /** Minimal int lookup so no JSON library is needed for a two-field file. */
    private int jsonInt(String json, String key) {
        try {
            int i = json.indexOf("\"" + key + "\"");
            if (i < 0) return 0;
            int c = json.indexOf(':', i); if (c < 0) return 0;
            StringBuilder n = new StringBuilder();
            for (int k = c + 1; k < json.length(); k++) {
                char ch = json.charAt(k);
                if (Character.isDigit(ch)) n.append(ch);
                else if (n.length() > 0) break;
            }
            return n.length() == 0 ? 0 : Integer.parseInt(n.toString());
        } catch (Exception e) { return 0; }
    }

    /** JS bridge exposed as window.BannonNative for the in-game OTA updater. */
    public class NativeBridge {
        /** The installed APK's versionCode (git commit count at build) — the real native build, which
         *  a hot-swapped HTML build cannot spoof. Used to decide when a native reinstall is required. */
        @JavascriptInterface
        public int getApkBuild() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            } catch (Exception e) { return 0; }
        }

        /** Open a URL (the APK download) in the system browser / installer. */
        @JavascriptInterface
        public void openUrl(String url) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (Exception e) { /* no-op */ }
        }
    }
}
