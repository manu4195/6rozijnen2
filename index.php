<php>

</php>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard</title>
    <!-- Tailwind CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 text-gray-900">
<div class="p-8">
    <h1 class="text-3xl font-bold text-blue-600">Welkom op je dashboard</h1>
    <p class="mt-4">Tailwind werkt zonder installatie!</p>
    <button class="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
        Klik hier
    </button>
</div>

<script>
    document.querySelector('button').addEventListener('click', () => {
        alert('Hallo vanaf JavaScript!');
    });
</script>
</body>
</html>

