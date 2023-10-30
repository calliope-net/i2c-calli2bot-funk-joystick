
//% color=#007F00 icon="\uf17b" block="Calli²bot" weight=29
//% groups='["beim Start","INPUT digital 6 Bit","INPUT Ultraschallsensor 16 Bit (mm)","INPUT Spursensoren 2*16 Bit [r,l]"]'
namespace calli2bot
/* 231024 calliope-net.github.io/callibot

Quellen:
https://github.com/knotechgmbh
https://github.com/MKleinSB/pxt-callibot
umgestellt auf i2c Adresse 0x22 und Register, 0x20 und 0x21 wird von dieser Erweiterung nicht genutzt
Calli:bot2 Steuercodes Seite 3-5:
https://github.com/calliope-net/callibot/blob/master/2021-11-12a_Callibot2_Software-Infos.pdf
    Ab CalliBot2 wird über Register gearbeitet. D.h. Es wird immer mindestens ein Byte geschrieben, welches das Register auswählt.
    Ein folgendes READ fragt dann dieses Register ab.
Code neu programmiert von Lutz Elßner im Oktober 2023
*/ {
    export enum eADDR {
        CB2_x22 = 0x22//, WR_MOTOR_x20 = 0x20, WR_LED_x21 = 0x21, RD_SENSOR_x21
        /*
        Ab CalliBot2 wird über Register gearbeitet. D.h. Es wird immer mindestens ein Byte geschrieben, 
        welches das Register auswählt. Ein folgendes READ fragt dann dieses Register ab.
        */
    }

    export enum eRegister {
        // Write
        RESET_OUTPUTS = 0x01, // Alle Ausgänge abschalten (Motor, LEDs, Servo)
        SET_MOTOR = 0x02, // Bit0: 1=Motor 1 setzen;  Bit1: 1=Motor 2 setzen
        /*
Bit0: 1=Motor 1 setzen;  Bit1: 1=Motor 2 setzen
wenn beide auf 11, dann Motor2 Daten nachfolgend senden (also 6 Bytes) Richtung (0:vorwärts, 1:rückwärts) von Motor 1 oder 2
PWM (0..255) Motor 1 oder 2
wenn in [1] Motor 1 & Motor 2 aktiviert
Richtung (0:vorwärts, 1:rückwärts) von Motor 2
PWM rechts (0..255) von Motor 2
        */
        SET_LED = 0x03, // Write: LED´s
        // Read
        GET_INPUTS = 0x80, // Digitaleingänge (1 Byte 6 Bit)
        GET_INPUT_US = 0x81, // Ultraschallsensor (3 Byte 16 Bit)
        GET_FW_VERSION = 0x82, // Typ & Firmwareversion & Seriennummer (10 Byte)
        GET_POWER = 0x83, // Versorgungsspannung [ab CalliBot2E] (3 Byte 16 Bit)
        GET_LINE_SEN_VALUE = 0x84 // Spursensoren links / rechts Werte (5 Byte 2x16 Bit)
    }


    /* 
        let n_i2cCheck: boolean = false // i2c-Check
        let n_i2cError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)
     */
    //% group="beim Start"
    //% block="i2c %pADDR beim Start || i2c-Check %ck" weight=4
    //% ck.shadow="toggleOnOff" ck.defl=1
    //% blockSetVariable=Calli2bot
    /* export function beimStart(pADDR: eADDR, ck?: boolean): calli2bot.Calli2bot {
        //n_i2cCheck = (ck ? true : false) // optionaler boolean Parameter kann undefined sein
        //n_i2cError = 0 // Reset Fehlercode
        //readRegister(pADDR, eCommandByte.CONFIGURATION)
        //let x=   Digital.prototype
        return new Calli2bot(pADDR, (ck ? true : false)) // optionaler boolean Parameter kann undefined sein
        //o.i2cRESET_OUTPUTS()
        //return o
    } */


    export enum eMotor {
        //% block="links"
        m1 = 0b01,
        //% block="rechts"
        m2 = 0b10,
        //% block="beide gleich"
        beide = 0b11
    }

    export enum eDirection {
        //% block="vorwärts"
        v = 0,
        //% block="rückwärts"
        r = 1
    }

    export enum eLed {
        //% block="linke rote LED"
        RED0 = 5,
        //% block="rechte rote LED"
        RED1 = 6,
        //% block="Spursucher LED links"
        SPURL = 7,
        //% block="Spursucher LED rechts"
        SPURR = 8,
        //% block="Power-ON LED"
        ON = 0
    }

    export enum eRgbLed {
        //% block="links vorne"
        LV = 1,
        //% block="rechts vorne"
        RV = 4,
        //% block="links hinten"
        LH = 2,
        //% block="rechts hinten"
        RH = 3,
        //% block="alle"
        All = 0
    }
    /* 
        export function between(i0: number, i1: number, i2: number): boolean {
            return (i0 >= i1 && i0 <= i2)
        } */
    /* 
        export function change0(p0_128_255: number) {
            //let bu = Buffer.create(1)
            //bu.setNumber(NumberFormat.UInt8LE, 0, p0_128_255)           // unsigned
            //let signed_128_0_127 = bu.getNumber(NumberFormat.Int8LE, 0) // signed
            let signed_128_0_127 = sign(p0_128_255)
            if (signed_128_0_127 < 0)
                return 2 * (128 + signed_128_0_127) // (u) 128 .. 255 -> (s) -128 .. -1  ->   0 .. 127
            else
                return -2 * (127 - signed_128_0_127) // (u)   0 .. 127 -> (s)    0 .. 127 -> 127 ..   0
        } */

    /*     // group="Motor (0 .. 255)"
        // lock="Vorzeichen %i || Bits 2** %exp" weight=2
        // exp.defl=7
        export function sign(i: number, exp: number = 7): number {
            //i = i2c.HEXe(i2c.H4.x40, i2c.H0.x1)
            if (i < 2 ** exp)  // 2**6 = 64 = 0x40
                return i
            else {
                return -((~i & ((2 ** exp) - 1)) + 1)
                //i = ~i // Bitwise Not
                //i = i & ((2 ** exp) - 1) // 63 = 0x3F alle Bits links löschen
                //i += 1
                //return -i
            }
        } */

    /* enum eRgbColor {
        red = 0xff0000,
        green = 0x00ff00,
        blue = 0x0000ff,
        yellow = 0xffff00,
        violett = 0xa300ff,
        aqua = 0x00ffdc,
        white = 0xffffff,
        black = 0x000000
    } */


    // ========== group="INPUT digital 6 Bit"




    // ========== group="INPUT Ultraschallsensor 16 Bit (mm)"


    // ========== group="INPUT Spursensoren 2*16 Bit [r,l]"




    // ========== advanced=true
    /* 
        //export enum eVersion { Typ, Firmware, Seriennummer }
        //% group="i2c Register lesen" advanced=true
        //% block="Version %pVersion HEX" weight=6
         function readFW_VERSION(pVersion: eVersion) {
            i2cWriteBuffer(eADDR.CB2_x22, Buffer.fromArray([eRegister.GET_FW_VERSION]), true)
            switch (pVersion) {
                case eVersion.Typ: { return i2cReadBuffer(eADDR.CB2_x22, 2).slice(1, 1).toHex() }
                case eVersion.Firmware: { return i2cReadBuffer(eADDR.CB2_x22, 6).slice(2, 4).toHex() }
                case eVersion.Seriennummer: { return i2cReadBuffer(eADDR.CB2_x22, 10).slice(6, 4).toHex() }
                default: { return i2cReadBuffer(eADDR.CB2_x22, 10).toHex() }
            }
        }
    
        //% group="i2c Register lesen" advanced=true
        //% block="Versorgungsspannung mV" weight=5
         function readPOWER(): number {
            i2cWriteBuffer(eADDR.CB2_x22, Buffer.fromArray([eRegister.GET_POWER]), true)
            return i2cReadBuffer(eADDR.CB2_x22, 3).getNumber(NumberFormat.UInt16LE, 1)
        }
    
        //% group="i2c Register lesen" advanced=true
        //% block="readRegister %pRegister size %size" weight=2
        //% pRegister.defl=calli2bot.eRegister.GET_INPUTS
        //% size.min=1 size.max=10 size.defl=1
         function readRegister(pRegister: eRegister, size: number): Buffer {
            i2cWriteBuffer(eADDR.CB2_x22, Buffer.fromArray([pRegister]), true)
            return i2cReadBuffer(eADDR.CB2_x22, size)
        }
     */

    // ========== advanced=true

    /* 
        // group="i2c Adressen" advanced=true
        // block="i2c Fehlercode" weight=2
        export function i2cError() { return n_i2cError }
    
        export function i2cWriteBuffer(pADDR: number, buf: Buffer, repeat: boolean = false) {
            if (n_i2cError == 0) { // vorher kein Fehler
                n_i2cError = pins.i2cWriteBuffer(pADDR, buf, repeat)
                if (n_i2cCheck && n_i2cError != 0)  // vorher kein Fehler, wenn (n_i2cCheck=true): beim 1. Fehler anzeigen
                    basic.showString(Buffer.fromArray([pADDR]).toHex()) // zeige fehlerhafte i2c-Adresse als HEX
            } else if (!n_i2cCheck)  // vorher Fehler, aber ignorieren (n_i2cCheck=false): i2c weiter versuchen
                n_i2cError = pins.i2cWriteBuffer(pADDR, buf, repeat)
            //else { } // n_i2cCheck=true und n_i2cError != 0: weitere i2c Aufrufe blockieren
        }
    
        export function i2cReadBuffer(pADDR: number, size: number, repeat: boolean = false): Buffer {
            if (!n_i2cCheck || n_i2cError == 0)
                return pins.i2cReadBuffer(pADDR, size, repeat)
            else
                return Buffer.create(size)
        } */




}// calli2bot.ts
