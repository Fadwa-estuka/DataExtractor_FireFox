# DataExtractor_FireFox
A Mozilla Firefox add-on for extracting and aligning search result data records based on their visual similarity and the Gestalt laws of grouping
## How to run the add-on
This add-on was built on SDK which no longer supported in Firefox 57 and above (https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Add-on_SDK/Tutorials/Getting_Started_(jpm)).

This add-on was successfully tested with Mozilla Developer Preview ver 49.0.1

As Mozilla Firefox specifies (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Distribution), unsigned extensions can be installed in Developer Edition, Nightly, and ESR versions of Firefox, after toggling the xpinstall.signatures.required preference in about:config.
To run the add-on: 
- download the extension folder from github
- open the command prompt and change your current directory to the extension folder
- type in the following command: jpm run -b "your path to firefox developer or nightly"
  Ex: jpm run -b "C:\Program Files\Mozilla Developer Preview\Firefox"

