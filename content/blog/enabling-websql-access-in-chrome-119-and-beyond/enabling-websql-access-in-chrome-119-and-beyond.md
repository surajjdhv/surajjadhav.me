---
title: Enabling WebSQL Access in Chrome 119 and Beyond.
description: Enabling WebSQL Access in Chrome 119 and Beyond.
date: 2023-11-06
tags:
  - tutorial
---

{%- css %}
ol li {
    padding-bottom: 10px;
}
{%- endcss %}

Starting with Chrome 119, Google Chrome has made some changes that impact WebSQL access. WebSQL is no longer available by default, but you can still enable it up to Chrome 123 using the "WebSQLAccess" policy. In this blog post, we'll walk you through the steps to enable WebSQL access on your Chrome browser.

## Enabling WebSQL Access on Windows

To enable the WebSQL policy on a Windows computer, you can follow these steps:

1. **Open the Registry Editor**:
   - Press `Win + R`, type "regedit," and press Enter.

2. **Navigate to the Following Path**:
   - If the path doesn't exist, you can create it:
     - `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome`

3. **Create a New DWORD 32-bit Value**:
   - Right-click in the right pane, select "New" > "DWORD (32-bit) Value."

4. **Name it WebSQLAccess**:
   - Set the name of the new value as "WebSQLAccess."

5. **Set the Value to 1**:
   - Double-click on "WebSQLAccess," set the value to 1, and click "OK."

Alternatively, you can download [this file](./EnableWebSQLAcessChromePolicy.reg) and run it as administrator to update registry.

## Enabling WebSQL Access on macOS

To enable WebSQL access on a Mac, follow these steps:

1. **Run the Following Command in Terminal**:
   - Open Terminal and type the following command:

     ```bash
     defaults write com.google.Chrome WebSQLAccess -bool true
     ```

2. **Restart Chrome**:
   - Close and reopen Google Chrome to allow the changes to take effect.

## Checking WebSQLAccess Policy

To verify that the changes have been successfully applied, you can follow these steps:

1. Open new tab and type `chrome://policy` in Google Chrome.

2. Search for "WebSQLAccess" in the policy list. It should appear with the appropriate settings like below table.

| Policy name | Policy value | Source | Applies to | Level | Status |
|---|---|---|---|---|---|
| WebSQLAccess | true | Platform | Machine | Mandatory | OK |

If everything is set up correctly, your Chrome browser should now have WebSQL access enabled, allowing you to use the feature as needed.

Please note that enabling features through policy changes can have security implications, so use this feature responsibly and consider the potential risks associated with enabling WebSQL access on your browser.

Happy browsing!
