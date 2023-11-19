radio.onReceivedNumber(function (receivedNumber) {
    Calli2bot.fahreJoystick(receivedNumber)
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 0, 15, lcd16x2rgb.lcd16x2_text(Calli2bot.getLog()[0]))
    Calli2bot.setRgbLed3(0x0000ff, true, true, true, true, true)
    Calli2bot.i2cReadINPUTS()
    if (Calli2bot.bitINPUTS(calli2bot.eINPUTS.ont)) {
        b = true
    }
    if (b) {
        Calli2bot.i2cReadINPUT_US()
        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 0, 15, lcd16x2rgb.lcd16x2_text("" + Math.round(Calli2bot.getINPUT_US() / 10) + " cm"), lcd16x2rgb.eAlign.right)
    } else {
        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 0, 15, lcd16x2rgb.lcd16x2_text(Calli2bot.getLog()[1]))
    }
})
let b = false
let Calli2bot: calli2bot.Calli2bot = null
radio.setGroup(22)
Calli2bot = calli2bot.beimStart(calli2bot.eADDR.CB2_x22)
lcd16x2rgb.initLCD(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E))
basic.showNumber(2)
lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 0, 15, lcd16x2rgb.lcd16x2_text("" + Calli2bot.i2cReadFW_VERSION(calli2bot.eVersion.Typ) + " | " + Calli2bot.i2cReadFW_VERSION(calli2bot.eVersion.Firmware)))
lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 0, 7, lcd16x2rgb.lcd16x2_text(Calli2bot.i2cReadFW_VERSION(calli2bot.eVersion.Seriennummer)))
b = false
