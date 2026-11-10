<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sensor de Red</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>%F0%9F%93%A1</text></svg>" />
    <link rel="stylesheet" href="flags.css">
</head>
<body class="sensor">

    <!-- Capas de ambiente -->
    <div class="cielo" aria-hidden="true"></div>
    <div class="luna" aria-hidden="true"></div>
    <div class="niebla" aria-hidden="true"></div>
    <div class="brasas" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>

    <main class="envoltura">
        <section class="tarjeta pantalla">
            <div class="crest" aria-hidden="true">📡</div>

            <h1>Sensor de Presencia Mágica</h1>
            <p class="susurro">La Sala de los Menesteres rastrea toda señal que cruce sus muros.</p>

            <div class="runa" aria-hidden="true">✦ ⟡ ✦</div>

            <form method="GET" action="ping.php" class="conjuro">
                <label class="campo-magico">
                    <span class="icono" aria-hidden="true">🧭</span>
                    <input type="text" name="ip" placeholder="Ej: 127.0.0.1">
                </label>
                <input type="submit" class="btn-magico" value="Rastrear">
            </form>

            <pre class="consola">
<?php
if(isset($_GET['ip']) && !empty($_GET['ip'])) {
    system("ping -c 3 " . $_GET['ip']);
}
?>
            </pre>

            <p class="nota-pie"><a href="index.html">← Volver al vestíbulo</a></p>
        </section>
    </main>

</body>
</html>
