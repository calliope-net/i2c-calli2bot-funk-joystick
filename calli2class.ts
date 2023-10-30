
namespace calli2bot {
    export class Calli2bot {
        private readonly i2cADDR: eADDR
        private readonly i2cCheck: boolean // i2c-Check
        private i2cError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)
        private motorPower: boolean

        private in_Digital: number
        private in_Ultraschallsensor: number
        private in_Spursensoren: number[]

        constructor(pADDR: eADDR, ck: boolean) {
            this.i2cADDR = pADDR
            this.i2cCheck = ck
            this.i2cError = 0 // Reset Fehlercode
            this.i2cRESET_OUTPUTS()
        }

        //% group="Reset" advanced=true
        //% block="alles aus %Calli2bot Motor, LEDs, Servo" weight=2
        i2cRESET_OUTPUTS() {
            this.i2cWriteBuffer(Buffer.fromArray([eRegister.RESET_OUTPUTS]))
            this.motorPower = false
        }

        // ========== group="INPUT digital 6 Bit"

        //% group="INPUT"
        //% block="neu einlesen %Calli2bot Digitaleingänge" weight=7
        i2cReadINPUTS() {
            this.i2cWriteBuffer(Buffer.fromArray([eRegister.GET_INPUTS]))
            this.in_Digital = this.i2cReadBuffer(1).getUint8(0)
        }

        //% group="INPUT"
        //% block="%Calli2bot %pINPUTS" weight=6
        bitINPUTS(pINPUTS: eINPUTS) {
            switch (pINPUTS) {
                case eINPUTS.sp0: return (this.in_Digital & 0b00000011) == 0
                case eINPUTS.sp1: return (this.in_Digital & 0b00000011) == 1
                case eINPUTS.sp2: return (this.in_Digital & 0b00000011) == 2
                case eINPUTS.sp3: return (this.in_Digital & 0b00000011) == 3
                case eINPUTS.st0: return (this.in_Digital & 0b00001100) == 0b00000000
                case eINPUTS.st1: return (this.in_Digital & 0b00001100) == 0b00000100
                case eINPUTS.st2: return (this.in_Digital & 0b00001100) == 0b00001000
                case eINPUTS.st3: return (this.in_Digital & 0b00001100) == 0b00001100
                case eINPUTS.ont: return (this.in_Digital & 0b00010000) == 0b00010000
                case eINPUTS.off: return (this.in_Digital & 0b00100000) == 0b00100000
                default: return false
            }
        }


        // ========== group="INPUT Ultraschallsensor 16 Bit (mm)"

        //% group="INPUT"
        //% block="neu einlesen %Calli2bot Ultraschallsensor" weight=3
        i2cReadINPUT_US() {
            this.i2cWriteBuffer(Buffer.fromArray([eRegister.GET_INPUT_US]))
            this.in_Ultraschallsensor = this.i2cReadBuffer(3).getNumber(NumberFormat.UInt16LE, 1)
        }

        //% group="INPUT"
        //% block="%Calli2bot Entfernung %pVergleich %vergleich mm" weight=2
        bitINPUT_US(pVergleich: eVergleich, vergleich: number) {
            switch (pVergleich) {
                case eVergleich.gt: return this.in_Ultraschallsensor > vergleich
                case eVergleich.lt: return this.in_Ultraschallsensor < vergleich
                default: return false
            }
        }

        // ========== group="INPUT Spursensoren 2*16 Bit [r,l]"

        //% group="INPUT Spursensoren 2*16 Bit [r,l]" advanced=true
        //% block="neu einlesen %Calli2bot Spursensoren" weight=6
        i2cReadLINE_SEN_VALUE() {
            this.i2cWriteBuffer(Buffer.fromArray([eRegister.GET_LINE_SEN_VALUE]))
            this.in_Spursensoren = this.i2cReadBuffer(5).slice(1, 4).toArray(NumberFormat.UInt16LE)
        }

        //% group="INPUT Spursensoren 2*16 Bit [r,l]" advanced=true
        //% block="%Calli2bot Spursensor %pRL %pVergleich %vergleich" weight=2
        //% inlineInputMode=inline
        bitLINE_SEN_VALUE(pRL: eRL, pVergleich: eVergleich, vergleich: number) {
            let sensor = this.in_Spursensoren.get(pRL)
            switch (pVergleich) {
                case eVergleich.gt: return sensor > vergleich
                case eVergleich.lt: return sensor < vergleich
                default: return false
            }
        }



        // ========== subcategory="Motor, LED"

        // ========== group="Motor (0 .. 255)"

        //% group="Motor (0 .. 255)"
        //% block="Motor %Calli2bot %eMotor %pPWM (0-255) %pRichtung" weight=9
        //% pwm.min=0 pwm.max=255 pwm.defl=128
        setMotor(pMotor: eMotor, pwm: number, pRichtung: eDirection) {
            if (this.between(pwm, 0, 255)) {
                this.motorPower = true
            } else { // falscher Parameter -> beide Stop
                pMotor = eMotor.beide; pwm = 0
            }
            if (pMotor == eMotor.beide)
                this.i2cWriteBuffer(Buffer.fromArray([eRegister.SET_MOTOR, pMotor, pRichtung, pwm, pRichtung, pwm]))
            else
                this.i2cWriteBuffer(Buffer.fromArray([eRegister.SET_MOTOR, pMotor, pRichtung, pwm]))
        }

        //% group="Motor (0 .. 255)"
        //% block="Motoren %Calli2bot links %pPWM1 (0-255) %pRichtung1 rechts %pPWM2 %pRichtung2" weight=8
        //% pwm1.min=0 pwm1.max=255 pwm1.defl=128 pwm2.min=0 pwm2.max=255 pwm2.defl=128
        //% inlineInputMode=inline
        setMotoren(pwm1: number, pRichtung1: eDirection, pwm2: number, pRichtung2: eDirection) {
            if (this.between(pwm1, 0, 255) && this.between(pwm2, 0, 255))
                this.i2cWriteBuffer(Buffer.fromArray([eRegister.SET_MOTOR, eMotor.beide, pRichtung1, pwm1, pRichtung2, pwm2]))
            else
                this.i2cWriteBuffer(Buffer.fromArray([eRegister.SET_MOTOR, eMotor.beide, 0, 0, 0, 0]))
        }

        // group="Motor (0 .. 255)"
        // lock="Joystick %Calli2bot %p0_128_255" weight=7
        // p0_128_255.min=0 p0_128_255.max=255
        /* change(p0_128_255: number) {
            //return sign(p0_128_255) * 2
            return change0(p0_128_255)
        } */

        //% group="Motor (0 .. 255)"
        //% block="fahre Joystick %Calli2bot receivedNumber: %pUInt32LE" weight=6
        fahreJoystick(pUInt32LE: number) {
            let joyBuffer32 = Buffer.create(4)
            joyBuffer32.setNumber(NumberFormat.UInt32LE, 0, pUInt32LE)

            // Buffer[0] Register 3: Horizontal MSB 8 Bit (0 .. 128 .. 255)
            let joyHorizontal = joyBuffer32.getUint8(0)
            if (0x7C < joyHorizontal && joyHorizontal < 0x83) joyHorizontal = 0x80 // off at the outputs

            // Buffer[1] Register 5: Vertical MSB 8 Bit (0 .. 128 .. 255)
            let joyVertical = joyBuffer32.getUint8(1)
            if (0x7C < joyVertical && joyVertical < 0x83) joyVertical = 0x80 // off at the outputs

            // Buffer[2] Register 7: Current Button Position (0:gedrückt)
            // joyBuffer32.getUint8(2) wird nicht ausgewertet

            // Buffer[3] Register 8: Button STATUS (1:war gedrückt)
            //let joyButton = joyBuffer32.getUint8(3) == 0 ? false : true
            // Motor Power ON ...
            if (joyBuffer32.getUint8(3) == 1)
                this.motorPower = true // Motor Power ON
            else if (this.motorPower)
                this.i2cRESET_OUTPUTS() // this.motorPower = false

            // fahren
            let fahren_minus255_0_255: number //= this.change(joyHorizontal) // (0.. 128.. 255) -> (-255 .. 0 .. +255)
            let signed_128_0_127 = this.sign(joyHorizontal)
            if (signed_128_0_127 < 0)
                fahren_minus255_0_255 = 2 * (128 + signed_128_0_127) // (u) 128 .. 255 -> (s) -128 .. -1  ->   0 .. 127
            else
                fahren_minus255_0_255 = -2 * (127 - signed_128_0_127) // (u)   0 .. 127 -> (s)    0 .. 127 -> 127 ..   0

            // minus ist rückwärts
            let fahren_Richtung: eDirection = (fahren_minus255_0_255 < 0 ? eDirection.r : eDirection.v)

            let fahren_0_255 = Math.abs(fahren_minus255_0_255)
            let fahren_links = fahren_0_255
            let fahren_rechts = fahren_0_255

            // lenken
            let lenken_255_0_255 = this.sign(joyVertical)
            let lenken_100_50 = Math.round(Math.map(Math.abs(lenken_255_0_255), 0, 128, 50, 100))

            // lenken Richtung
            if (lenken_255_0_255 < 0) // minus ist rechts
                fahren_rechts = Math.round(fahren_rechts * lenken_100_50 / 100)
            else
                fahren_links = Math.round(fahren_links * lenken_100_50 / 100)
            /* 
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 0, 3, joyHorizontal, lcd16x2rgb.eAlign.right)
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 4, 7, fahren_minus255_0_255, lcd16x2rgb.eAlign.right)
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 8, 11, fahren_links, lcd16x2rgb.eAlign.right)
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 12, 15, fahren_rechts, lcd16x2rgb.eAlign.right)
            
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 0, 3, joyVertical, lcd16x2rgb.eAlign.right)
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 4, 7, lenken_255_0_255, lcd16x2rgb.eAlign.right)
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 8, 11, lenken_100_50, lcd16x2rgb.eAlign.right)
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 13, 13, fahren_Richtung)
                        lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 15, 15, this.motorPower)
             */
            if (this.motorPower)
                this.setMotoren(fahren_links, fahren_Richtung, fahren_rechts, fahren_Richtung)

        }

        // ========== group="LED"

        //% group="LED"
        //% block="LED %Calli2bot %led %onoff || Helligkeit %pwm" weight=4
        //% onoff.shadow="toggleOnOff"
        //% pwm.min=1 pwm.max=16 pwm.defl=16
        setLed(pLed: eLed, on: boolean, pwm?: number) {
            if (!on) pwm = 0
            else if (on && Number.isNaN(pwm)) pwm = 16
            let buffer = Buffer.fromArray([eRegister.SET_LED, pLed, pwm])
            this.i2cWriteBuffer(buffer)
        }

        //% group="LED"
        //% block="RGB LED %Calli2bot %led rot %red grün %green blau %blue" weight=2
        //% red.min=0 red.max=15
        //% green.min=0 green.max=15
        //% blue.min=0 blue.max=15
        //% inlineInputMode=inline
        setRgbLed(led: eRgbLed, red: number, green: number, blue: number) {
            let buffer = Buffer.fromArray([eRegister.SET_LED, led, red, green, blue])
            if (led != eRgbLed.All)
                this.i2cWriteBuffer(buffer);
            else // all leds, repeat 4 times
                for (let index = 1; index < 5; index++) {
                    buffer[1] = index;
                    this.i2cWriteBuffer(buffer)
                    basic.pause(10)
                }
        }


        // ========== advanced=true

        // ========== group="gespeicherte Werte lesen (nach 'neu einlesen')" advanced=true

        //% group="gespeicherte Werte lesen (nach 'neu einlesen')" advanced=true
        //% block="%Calli2bot Digitaleingänge 6 Bit" weight=8
        getINPUTS() { return this.in_Digital }

        //% group="gespeicherte Werte lesen (nach 'neu einlesen')" advanced=true
        //% block="%Calli2bot Ultraschallsensor 16 Bit (mm)" weight=4
        getINPUT_US() { return this.in_Ultraschallsensor }

        //% group="gespeicherte Werte lesen (nach 'neu einlesen')" advanced=true
        //% block="%Calli2bot Spursensor %pRL" weight=2
        getLINE_SEN_VALUE(pRL: eRL) { return this.in_Spursensoren.get(pRL) }


        // ========== group="i2c Register lesen" subcategory="i2c Register"

        //% group="i2c Register lesen" subcategory="i2c Register"
        //% block="%Calli2bot Version %pVersion HEX" weight=6
        i2cReadFW_VERSION(pVersion: eVersion) {
            this.i2cWriteBuffer(Buffer.fromArray([eRegister.GET_FW_VERSION]))
            switch (pVersion) {
                case eVersion.Typ: { return this.i2cReadBuffer(2).slice(1, 1).toHex() }
                case eVersion.Firmware: { return this.i2cReadBuffer(6).slice(2, 4).toHex() }
                case eVersion.Seriennummer: { return this.i2cReadBuffer(10).slice(6, 4).toHex() }
                default: { return this.i2cReadBuffer(10).toHex() }
            }
        }

        //% group="i2c Register lesen" subcategory="i2c Register"
        //% block="%Calli2bot Versorgungsspannung mV" weight=4
        i2cReadPOWER(): number {
            this.i2cWriteBuffer(Buffer.fromArray([eRegister.GET_POWER]))
            return this.i2cReadBuffer(3).getNumber(NumberFormat.UInt16LE, 1)
        }

        //% group="i2c Register lesen" subcategory="i2c Register"
        //% block="%Calli2bot readRegister %pRegister size %size" weight=2
        //% pRegister.defl=calli2bot.eRegister.GET_INPUTS
        //% size.min=1 size.max=10 size.defl=1
        i2cReadRegister(pRegister: eRegister, size: number): Buffer {
            this.i2cWriteBuffer(Buffer.fromArray([pRegister]))
            return this.i2cReadBuffer(size)
        }

        //% group="i2c Register lesen" subcategory="i2c Register"
        //% block="%Calli2bot i2c Fehlercode" weight=1
        geti2cError() { return this.i2cError }


        // ========== group="i2c Register schreiben"

        //% group="i2c Register schreiben" subcategory="i2c Register"
        //% block="%Calli2bot writeRegister %pRegister Bytes %bytes" weight=1
        i2cWriteRegister(pRegister: eRegister, bytes: number[]) {
            bytes.insertAt(0, pRegister)
            this.i2cWriteBuffer(Buffer.fromArray(bytes))
        }


        // ========== private

        private between(i0: number, i1: number, i2: number): boolean { return (i0 >= i1 && i0 <= i2) }

        private sign(i: number, e: number = 7): number {
            if (i < 2 ** e) return i
            else return -((~i & ((2 ** e) - 1)) + 1)
        }

        private i2cWriteBuffer(buf: Buffer) { // repeat funktioniert nicht
            if (this.i2cError == 0) { // vorher kein Fehler
                this.i2cError = pins.i2cWriteBuffer(this.i2cADDR, buf)
                if (this.i2cCheck && this.i2cError != 0)  // vorher kein Fehler, wenn (n_i2cCheck=true): beim 1. Fehler anzeigen
                    basic.showString(Buffer.fromArray([this.i2cADDR]).toHex()) // zeige fehlerhafte i2c-Adresse als HEX
            } else if (!this.i2cCheck)  // vorher Fehler, aber ignorieren (n_i2cCheck=false): i2c weiter versuchen
                this.i2cError = pins.i2cWriteBuffer(this.i2cADDR, buf)
            //else { } // n_i2cCheck=true und n_i2cError != 0: weitere i2c Aufrufe blockieren
        }

        private i2cReadBuffer(size: number): Buffer { // repeat funktioniert nicht
            if (!this.i2cCheck || this.i2cError == 0)
                return pins.i2cReadBuffer(this.i2cADDR, size)
            else
                return Buffer.create(size)
        }

    } // class Calli2bot



    export enum eINPUTS {
        //% block="Spursucher aus"
        sp0, //= 0b00000000,
        //% block="Spursucher rechts"
        sp1, //= 0b00000001,
        //% block="Spursucher links"
        sp2, //= 0b00000010,
        //% block="Spursucher beide"
        sp3, //= 0b00000011,
        //% block="Stoßstange aus"
        st0, //= 0b00000000,
        //% block="Stoßstange rechts"
        st1, //= 0b00000100,
        //% block="Stoßstange links"
        st2, //= 0b00001000,
        //% block="Stoßstange beide"
        st3, //= 0b00001100,
        //% block="ON-Taster"
        ont, //= 0b00010000,
        //% block="OFF-Taster"
        off //= 0b00100000
    }

    export enum eRL { rechts = 0, links = 1 } // Index im Array

    export enum eVergleich {
        //% block=">"
        gt,
        //% block="<"
        lt
    }

    export enum eVersion { Typ, Firmware, Seriennummer }

} // calli2class.ts
