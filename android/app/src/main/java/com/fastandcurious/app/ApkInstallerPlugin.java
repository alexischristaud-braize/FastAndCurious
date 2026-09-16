package com.fastandcurious.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void download(PluginCall call) {
        String urlString = call.getString("url");

        if (urlString == null) {
            call.reject("URL de l'APK manquante");
            return;
        }

        getBridge().execute(() -> {
            HttpURLConnection connection = null;

            try {
                URL url = new URL(urlString);

                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setInstanceFollowRedirects(true);
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);

                connection.connect();

                int responseCode = connection.getResponseCode();

                if (responseCode < 200 || responseCode >= 300) {
                    call.reject("Erreur HTTP " + responseCode);
                    return;
                }

                File apkFile = new File(
                    getContext().getCacheDir(),
                    "fastandcurious-update.apk"
                );

                try (
                    InputStream input = connection.getInputStream();
                    FileOutputStream output = new FileOutputStream(apkFile)
                ) {
                    byte[] buffer = new byte[8192];
                    int length;

                    while ((length = input.read(buffer)) != -1) {
                        output.write(buffer, 0, length);
                    }
                }

                Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    apkFile
                );

                JSObject result = new JSObject();
                result.put("uri", apkUri.toString());

                call.resolve(result);

            } catch (Exception e) {
                call.reject(
                    "Erreur lors du téléchargement : " + e.getMessage()
                );

            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        });
    }

    @PluginMethod
    public void install(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null) {
            call.reject("URI de l'APK manquante");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                !getContext().getPackageManager().canRequestPackageInstalls()) {

            Intent settingsIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );

            getActivity().startActivity(settingsIntent);
            call.reject("Permission d'installation requise");
            return;
        }

        Uri apkUri;

        if (uriString.startsWith("file://")) {
            File apkFile = new File(Uri.parse(uriString).getPath());

            apkUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                apkFile
            );
        } else {
            apkUri = Uri.parse(uriString);
        }

        Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
        intent.setDataAndType(
            apkUri,
            "application/vnd.android.package-archive"
        );
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        // Pas de FLAG_ACTIVITY_NEW_TASK : incompatible avec startActivityForResult

        startActivityForResult(call, intent, "installResultCallback");
    }

    @ActivityCallback
    private void installResultCallback(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        JSObject ret = new JSObject();
        boolean success = result.getResultCode() == Activity.RESULT_OK;

        ret.put("success", success);
        ret.put("resultCode", result.getResultCode());

        call.resolve(ret);
    }
}