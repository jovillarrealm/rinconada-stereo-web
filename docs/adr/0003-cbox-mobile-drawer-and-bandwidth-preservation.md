# 3. Cbox Mobile Presentation and Bandwidth Preservation

Context: The Cbox community chat is an external iframe that introduces ~350 KiB of third-party scripts, open network sockets, and an embedded scroll container that easily hijacks touch gestures (scroll-trapping) on small mobile screens.

Decision: Display Cbox as an open two-column panel on desktop, but encapsulate it behind a collapsible, on-demand drawer / toggle on mobile devices ("Abrir Chat en vivo") with delayed iframe mounting until user interaction.

Why: Mobile listeners come first and foremost to listen to the live broadcast without scroll interference or battery drain. Keeping chat on-demand on mobile eliminates accidental touch-scroll hijacking, saves battery on budget devices, and prevents unnecessary third-party socket traffic.
