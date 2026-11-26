package com.avdhut.tracker;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FocusNative")
public class FocusNativePlugin extends Plugin {
    private static final String CHANNEL_ID = "avdhut_timer_channel";
    private static final int TIMER_NOTIF_ID = 1001;

    @PluginMethod
    public void startAppPinning(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                activity.startLockTask();
                call.resolve();
            } catch (Exception e) {
                call.reject("Could not start app pinning: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopAppPinning(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                activity.stopLockTask();
            } catch (Exception ignored) {
                // Ignore if not currently pinned
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void enableDnd(PluginCall call) {
        Context ctx = getContext();
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        JSObject ret = new JSObject();
        if (nm == null) {
            ret.put("enabled", false);
            ret.put("needsPermission", false);
            call.resolve(ret);
            return;
        }

        if (!nm.isNotificationPolicyAccessGranted()) {
            ret.put("enabled", false);
            ret.put("needsPermission", true);
            call.resolve(ret);
            return;
        }

        try {
            nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALARMS);
            ret.put("enabled", true);
            ret.put("needsPermission", false);
        } catch (Exception e) {
            ret.put("enabled", false);
            ret.put("needsPermission", false);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void disableDnd(PluginCall call) {
        Context ctx = getContext();
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null && nm.isNotificationPolicyAccessGranted()) {
            try {
                nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
            } catch (Exception ignored) {
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void openDndPolicySettings(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent("android.settings.ZEN_MODE_SETTINGS");
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(fallback);
            } catch (Exception ignored) {
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void updateTimerNotification(PluginCall call) {
        String title = call.getString("title", "Avdhut · Focus Running");
        String body = call.getString("body", "Timer active");
        boolean isRunning = Boolean.TRUE.equals(call.getBoolean("isRunning", true));

        Context ctx = getContext();
        Activity activity = getActivity();
        if (Build.VERSION.SDK_INT >= 33 && activity != null) {
            if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    activity,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    2001
                );
                call.resolve();
                return;
            }
        }

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            call.resolve();
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Avdhut Focus Timer",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active focus timer in the notification panel");
            nm.createNotificationChannel(channel);
        }

        Intent openIntent = new Intent(ctx, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pendingIntent = PendingIntent.getActivity(ctx, 0, openIntent, piFlags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(ctx, CHANNEL_ID)
            : new Notification.Builder(ctx);

        builder
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(ctx.getApplicationInfo().icon)
            .setOngoing(isRunning)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent);

        nm.notify(TIMER_NOTIF_ID, builder.build());
        call.resolve();
    }

    @PluginMethod
    public void clearTimerNotification(PluginCall call) {
        Context ctx = getContext();
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(TIMER_NOTIF_ID);
        }
        call.resolve();
    }
}
