radio.onReceivedNumber(function (receivedNumber) {
    Calli2bot.fahreJoystick(receivedNumber)
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 0, 15, lcd16x2rgb.lcd16x2_text(Calli2bot.getLog()[0]))
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 0, 15, lcd16x2rgb.lcd16x2_text(Calli2bot.getLog()[1]))
})
let Calli2bot: calli2bot.Calli2bot = null
radio.setGroup(22)
Calli2bot = calli2bot.beimStart(calli2bot.eADDR.CB2_x22)
lcd16x2rgb.initLCD(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E))
