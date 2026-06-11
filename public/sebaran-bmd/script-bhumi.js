(() => {
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);

    URL.createObjectURL = async function (blob) {
        if (blob.type === "application/geo+json") {
            const text = await blob.text();

            await navigator.clipboard.writeText(text);

            const toast = document.createElement("div");
            toast.innerHTML = `
        ✅ GeoJSON copied to clipboard<br>
        Size: ${text.length} chars
      `;

            toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        background: #28a745;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,.3);
      `;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 3000);

            console.log(
                "GeoJSON copied to clipboard",
                text.length,
                "chars"
            );
        }

        return originalCreateObjectURL(blob);
    };

    console.log("GeoJSON clipboard capture installed");
})();