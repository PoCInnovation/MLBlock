# Firewall settup in Oracle Cloud

No
0.0.0.0/0
TCP
All
22
TCP traffic for ports: 22 SSH Remote Login Protocol

No
0.0.0.0/0
ICMP
3, 4
ICMP traffic for: 3, 4 Destination Unreachable: Fragmentation Needed and Don't Fragment was Set

No
10.0.0.0/16
ICMP
3
ICMP traffic for: 3 Destination Unreachable

No
0.0.0.0/0
TCP
All
80
TCP traffic for ports: 80
Coolify (Dashboard, Terminal, Realtime, Web)

No
0.0.0.0/0
TCP
All
443
TCP traffic for ports: 443 HTTPS
Coolify (Dashboard, Terminal, Realtime, Web)

No
0.0.0.0/0
TCP
All
6001
TCP traffic for ports: 6001
Coolify (Dashboard, Terminal, Realtime, Web)

No
0.0.0.0/0
TCP
All
6002
TCP traffic for ports: 6002
Coolify (Dashboard, Terminal, Realtime, Web)

No
0.0.0.0/0
TCP
All
8000
TCP traffic for ports: 8000
Coolify (Dashboard, Terminal, Realtime, Web)


No
10.0.0.0/16
All Protocols
All traffic for all ports
Trafic interne complet entre instances (Coolify Workers, BDD privées)
