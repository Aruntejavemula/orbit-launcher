using System.Text.Json;
using Windows.Services.Store;
using WinRT.Interop;

try
{
    long hwnd = 0;
    for (var i = 0; i < args.Length - 1; i++)
    {
        if (args[i] == "--hwnd" && long.TryParse(args[i + 1], out var parsed))
            hwnd = parsed;
    }

    var context = StoreContext.GetDefault();
    if (hwnd != 0)
        InitializeWithWindow.Initialize(context, new IntPtr(hwnd));

    var updates = await context.GetAppAndOptionalStorePackageUpdatesAsync();
    if (updates.Count == 0)
    {
        Console.WriteLine(JsonSerializer.Serialize(new { ok = true, status = "up-to-date", count = 0, mandatory = false }));
        return;
    }

    var mandatory = updates.Any(u => u.Mandatory);
    var operation = context.RequestDownloadAndInstallStorePackageUpdatesAsync(updates);
    await operation.AsTask();

    Console.WriteLine(
        JsonSerializer.Serialize(new { ok = true, status = "install-started", count = updates.Count, mandatory })
    );
}
catch (Exception ex)
{
    var message = string.IsNullOrWhiteSpace(ex.Message) ? ex.GetType().Name : ex.Message;
    Console.Error.WriteLine(JsonSerializer.Serialize(new { ok = false, status = "error", message }));
    Environment.Exit(1);
}
