@echo off
START node technician knee.* ankle.*
START node technician knee.* elbow.*

set loopcount=10
:loop
CALL node doctor knee.Guzik &
CALL node doctor knee.Nowak &
CALL node doctor ankle.Kluczewski &
CALL node doctor elbow.Gil
set /a loopcount=loopcount-1
if %loopcount%==0 goto exitloop
goto loop
:exitloop

PAUSE