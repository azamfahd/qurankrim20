const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('</style>    </div>    <!-- استخدام مسار نسبي للملف الرئيسي -->    <script type="module" src="/src/index.tsx"></script></body></html>',
`</style>    </div>
    <script>
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", function() {
          navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(function(r){console.log("SW Registered");}).catch(function(e){console.log("SW Error",e);});
        });
      }
    </script>
    <script type="module" src="/src/index.tsx"></script>
</body></html>`);
fs.writeFileSync('index.html', html);
