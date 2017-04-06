# rabbitmq

"Obsługa oddziału ortopedycznego w szpitalu"

Mamy 3 typy użytkowników:

Lekarz (zleca badania, dostaje wyniki)
Technik (wykonuje badania, wysyła wyniki)
Administrator (loguje całą aktywność, może wysyłać informacje do wszystkich)

Szpital przyjmuje pacjentów z kontuzjami: Kostki (ankle), kolana (knee) lub łokcia (elbow)

Lekarz:
Wysyła zlecenie badania podając typ badania (np. knee) oraz nazwisko pacjenta, do dowolnego technika, który umie wykonać takie badanie
Otrzymuje wyniki asynchronicznie


Technik
Każdy technik umie wykonać 2 typy badań, które podawane są przy starcie (np. knee, ankle)
Przyjmuje zgłoszenia danego typu i odsyła do lekarza zlecającego (wystarczy odesłać nazwę pacjenta +  „ badanie”)


Administrator
Loguje całą aktywność (dostaje kopie wszystkich wiadomości – zleceń oraz odpowiedzi)
Ma możliwość przesłania wiadomości (info) do wszystkich
