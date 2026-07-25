package com.bannon.game;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
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

        // load the bundled game; models stream from the CDN fallback baked into the page
        web.loadUrl("file:///android_asset/index.html");

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
