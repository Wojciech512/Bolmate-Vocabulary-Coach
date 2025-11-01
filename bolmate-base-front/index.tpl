<!DOCTYPE html>
<html lang="nl">

<head>
	<meta charset="UTF-8">
	<title>Bolmate Base</title>
	<meta http-equiv="Content-Type" content="text/html" />
	<meta name="description" content="Bolmate Base" />
	<meta name="Author" content="Dave van Rijn Development" />

	<meta name="robots" content="noodp">
	<meta name="robots" content="noydir" />

	<meta http-equiv="content-language" content="nl-nl">

	<!--  General mobile settings (Android) -->
	<meta name="mobile-web-app-capable" content="yes">

	<!-- IOS settings: -->
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">


	<link rel="apple-touch-icon" sizes="180x180" href="https://app.bolmate.nl/favicon/apple-touch-icon.png?v=ngjBkj4Eqy">
    <link rel="icon" type="image/png" sizes="32x32" href="https://app.bolmate.nl/favicon/favicon-32x32.png?v=ngjBkj4Eqy">
    <link rel="icon" type="image/png" sizes="16x16" href="https://app.bolmate.nl/favicon/favicon-16x16.png?v=ngjBkj4Eqy">
    <link rel="manifest" href="https://app.bolmate.nl/favicon/site.webmanifest?v=ngjBkj4Eqy">
    <link rel="mask-icon" href="https://app.bolmate.nl/favicon/safari-pinned-tab.svg?v=ngjBkj4Eqy" color="#2568EF">
    <link rel="shortcut icon" href="https://app.bolmate.nl/favicon/favicon.ico?v=ngjBkj4Eqy">
    <meta name="apple-mobile-web-app-title" content="Bolmate">
    <meta name="application-name" content="Bolmate">
    <meta name="msapplication-TileColor" content="#2d89ef">
    <meta name="msapplication-config" content="https://app.bolmate.nl/favicon/browserconfig.xml?v=ngjBkj4Eqy">
    <meta name="theme-color" content="#ffffff">

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

	<script type="text/javascript">
    		var mode = <%=htmlWebpackPlugin.options.environment.mode%>;
		    var version = <%=htmlWebpackPlugin.options.version%>;
		    var settings = {
		        maintenanceMode: false
		    };
    </script>
</head>

<body>
	<div id="content" class="main-content"></div>
</body>

</html>
