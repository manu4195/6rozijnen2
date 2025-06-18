<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard - Rozeijnen</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-100 text-gray-900">
<div class="flex h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#0B1F2F] text-white flex flex-col justify-between">
        <div>
            <div class="flex items-center gap-3 p-4">
                <div class="bg-green-500 p-2 rounded-full"></div>
                <span class="text-xl font-bold">Rozeijnen</span>
            </div>
            <nav class="mt-6">
                <ul>
                    <li class="px-4 py-2 hover:bg-[#153247] cursor-pointer">Dashboard</li>
                    <li class="px-4 py-2 bg-[#153247] cursor-pointer rounded-l-full">Personalize</li>
                    <li class="px-4 py-2 hover:bg-[#153247] cursor-pointer">Tips</li>
                    <li class="px-4 py-2 hover:bg-[#153247] cursor-pointer">Settings</li>
                </ul>
            </nav>
        </div>
        <div class="p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gray-500"></div>
            <div>
                <div class="text-sm font-semibold">Alex Morgan</div>
                <div class="text-xs text-gray-300">Reserve Page</div>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6 overflow-auto">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Personalize</h1>
            <div class="flex gap-3">
                <button class="bg-white border px-4 py-2 rounded">Vandaag</button>
                <button class="bg-blue-600 text-white px-4 py-2 rounded">Export data</button>
                <button class="bg-gray-200 px-4 py-2 rounded">Save Changes</button>
            </div>
        </div>

        <!-- Metrics -->
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded p-4 shadow">
                <p class="text-sm text-gray-500">Totale energie Productie</p>
                <p class="text-xl font-bold text-green-500">24.8 kWh</p>
                <p class="text-sm text-gray-500">+15% vs gisteren</p>
            </div>
            <div class="bg-white rounded p-4 shadow">
                <p class="text-sm text-gray-500">Stroomverbruik</p>
                <p class="text-xl font-bold text-red-500">18.2 kWh</p>
                <p class="text-sm text-gray-500">-12% vs gisteren</p>
            </div>
            <div class="bg-white rounded p-4 shadow">
                <p class="text-sm text-gray-500">Batterij Status</p>
                <p class="text-xl font-bold text-blue-500">78%</p>
                <p class="text-sm text-gray-500">8% van opslag</p>
            </div>
            <div class="bg-white rounded p-4 shadow">
                <p class="text-sm text-gray-500">Kosten Besparing</p>
                <p class="text-xl font-bold text-yellow-500">€127,40</p>
                <p class="text-sm text-gray-500">Deze maand</p>
            </div>
        </div>

        <!-- Widgets -->
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-white h-40 rounded shadow relative">
                <button class="absolute top-2 right-2 text-red-500">&#10006;</button>
                <div class="p-4 text-gray-400">Energie Productie</div>
            </div>
            <div class="bg-white h-40 rounded shadow relative">
                <button class="absolute top-2 right-2 text-red-500">&#10006;</button>
                <div class="p-4 text-gray-400">Verbruik vs Productie</div>
            </div>
        </div>

        <!-- Meldingen en Weer -->
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-white rounded shadow p-4">
                <h2 class="font-bold mb-2">Meldingen & Waarschuwingen</h2>
                <div class="bg-red-100 text-red-700 p-2 mb-2 rounded text-sm">Hoog verbruik gedetecteerd</div>
                <div class="bg-green-100 text-green-700 p-2 mb-2 rounded text-sm">Optimale productie</div>
                <div class="bg-blue-100 text-blue-700 p-2 rounded text-sm">Batterij bijna vol</div>
            </div>
            <div class="bg-white rounded shadow p-4">
                <h2 class="font-bold mb-2">Weer Voorspelling</h2>
                <div class="flex items-center gap-4">
                    <div class="text-3xl">22°C</div>
                    <div>
                        <p>Zon/warmt.</p>
                        <p class="text-sm text-gray-500">Verwachte productie: 28 kWh</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Apparaten Status -->
        <div class="bg-white rounded shadow p-4">
            <h2 class="font-bold mb-2">Apparaten Status</h2>
            <div class="grid grid-cols-4 gap-4">
                <div class="bg-green-100 p-2 rounded text-center">Zonnepanelen<br><span class="text-sm text-gray-500">Actief</span></div>
                <div class="bg-gray-200 p-2 rounded text-center">Batterij<br><span class="text-sm text-gray-500">Opladen</span></div>
                <div class="bg-yellow-100 p-2 rounded text-center">Warmtepomp<br><span class="text-sm text-gray-500">Inactief</span></div>
                <div class="bg-gray-100 p-2 rounded text-center">+
                    <br><span class="text-sm text-gray-500">Toevoegen</span></div>
            </div>
        </div>

    </main>
</div>
</body>
</html>