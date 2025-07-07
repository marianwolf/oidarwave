<?php
$empfaengerEmail = 'marian.wolf2008@gmail.com';
$betreff = 'Neue Kontaktanfrage von deiner Webseite';
$dankeSeite = 'index.html';
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars(strip_tags(trim($_POST['name'] ?? '')));
    $email = htmlspecialchars(strip_tags(trim($_POST['email'] ?? '')));
    $nachricht = htmlspecialchars(strip_tags(trim($_POST['message'] ?? '')));
    $fehler = [];
    if (empty($name)) {
        $fehler[] = "Bitte gib deinen Namen ein.";
    }
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $fehler[] = "Bitte gib eine gültige E-Mail-Adresse ein.";
    }
    if (empty($nachricht)) {
        $fehler[] = "Bitte gib eine Nachricht ein.";
    }
    if (empty($fehler)) {
        $emailInhalt = "Name: " . $name . "\n";
        $emailInhalt .= "E-Mail: " . $email . "\n";
        $emailInhalt .= "Nachricht:\n" . $nachricht . "\n";
        $emailHeader = "From: " . $name . " <" . $email . ">\r\n";
        $emailHeader .= "Reply-To: " . $email . "\r\n";
        $emailHeader .= "X-Mailer: PHP/" . phpversion();
        if (mail($empfaengerEmail, $betreff, $emailInhalt, $emailHeader)) {
            if (!empty($dankeSeite)) {
                header("Location: " . $dankeSeite);
                exit;
            } else {
                echo "Vielen Dank! Deine Nachricht wurde erfolgreich gesendet.";
            }
        } else {
            echo "Es gab ein Problem beim Senden deiner Nachricht. Bitte versuche es später erneut.";
        }
    } else {
        echo "Beim Senden deiner Nachricht sind folgende Fehler aufgetreten:<br>";
        foreach ($fehler as $msg) {
            echo "- " . $msg . "<br>";
        }
    }
} else {
    echo "Dieses Skript sollte nur über ein Formular aufgerufen werden.";
}
?>