/*
Calendar for Eberron, Faerun, Greyhawk, Modern and Tal'Dorei Settings
Original created by Kirsty (https://app.roll20.net/users/1165285/kirsty)
API Commands:
!mwcal - Shows the menu to the person that issued the Command. GM menu has more Options.
    --world {world}- Allows the GM to change the world to one of the Options (Eberron, Faerun, Greyhawk, Modern, Tal'Dorei)
    --adv {type} --{amount} - Allows the GM to advance the time by a certain amount and a certain type (Short Rest, Long Rest, Hour, Minute, Day, Week, Month, Year)
    --set {type} --{amount} - Allows the GM to set the day, month, year etc.
    --weather {type} - Allows the GM to set the weather. Putting "Random" will randomise the weather.
    --toggle {weather/moon} - Allows the GM to toggle the weather and moon Display.
    --moon {type} - Allows the GM to set the moon state. Putting "Random" will randomise it and "Normal" will use the Moon Cycle based on months.
    --enc - Rolls on the Encounter table. (coming soon)
    --reset - Will reset everything.
!showcal - Shows the Calendar to the Players.
!alarm - Pulls up to Alarm Menu
    --{number} - Lets you view a certain Alarm
    --new - Lets you create a new Alarm
    --set {number} - Lets you set a specific Alarm. Type the Number of the Alarm.
        --title {title} - Sets the title of the Alarm.
        --date {date} - Sets the Alarm to a certain date. This uses the following format: DD.MM.YYYY
        --time {time} - Sets the Alarm to a certain time. This uses the following format (24 Hour): HH:MM
*/
var MultiWorldCalendar = MultiWorldCalendar || (function() {
    'use strict';

    var version = "5.3",

    setDefaults = function() {
        state.MWCalendar = {
            now: {
                ordinal: 1,
                world: 1,
                year: 1486,
                day: 1,
                month: "Hammer",
                hour: 1,
                minute: 0,
                weather: "It is a cool but sunny day",
                moon: "Full Moon",
                moonImg: "",
                mtype: "ON",
                wtype: "ON",
                prevType: "normal"
            },
        };
    },

    setAlarmDefaults = function() {
        state.Alarm = [];
    },

    handleInput = function(msg) {
        var args=msg.content.split(/\s+--/);
        if (msg.type!=="api") {
            return;
        }
        if (playerIsGM(msg.playerid)) {
            switch (args[0]) {
                case '!mwcal':
                    if (args[1]==undefined) {
                        weather("random");
                        moon(state.MWCalendar.now.prevType);
                        calmenu();
                        chkalarms();
                    } else {
                        if (args[1].includes("world")) {
                            let option=(args[1].toLowerCase()).replace("world ","");
                            if (option.includes("random")) {
                                let rand=randomInteger(2);
                                if (rand==1) {
                                    state.MWCalendar.now.world=1;
                                    state.MWCalendar.now.mtype="ON";
                                } else if (rand==2) {
                                    state.MWCalendar.now.world=4;
                                    state.MWCalendar.now.mtype="OFF";
                                }
                            } else if (option.includes("eberron")) {
                                state.MWCalendar.now.world=4;
                                state.MWCalendar.now.mtype="OFF";
                            } else if (option.includes("faerun") || option.includes("faerûn")) {
                                state.MWCalendar.now.world=1;
                                state.MWCalendar.now.mtype="ON";
                            } else if (option.includes("greyhawk")) {
                                //state.MWCalendar.now.world=2;
                                sendChat("Multi-World Calendar","/w gm Greyhawk has not yet been implemented!");
                            } else if (option.includes("modern")) {
                                //state.MWCalendar.now.world=3;
                                sendChat("Multi-World Calendar","/w gm Modern has not yet been implemented!");
                            } else if (option.includes("tal")) {
                                //state.MWCalendar.now.world=5;
                                sendChat("Multi-World Calendar","/w gm Tal\'Dorei has not yet been implemented!");
                            }
                            weather("random");
                            moon(state.MWCalendar.now.prevType);
                            calmenu();
                            chkalarms();
                        } else if (args[1].includes("adv")) {
                            let type=String(args[1].toLowerCase()).replace("adv ","");
                            let amount=Number(args[2]);
                            switch (type) {
                                case 'short rest':
                                    addtime(amount,"hour");
                                    calmenu();
                                    chkalarms();
                                    return;
                                case 'long rest':
                                    addtime(amount*8,"hour");
                                    calmenu();
                                    chkalarms();
                                    return;
                                case 'hour':
                                    addtime(amount,"hour");
                                    calmenu();
                                    chkalarms();
                                    return;
                                case 'minute':
                                    addtime(amount,"minute");
                                    calmenu();
                                    chkalarms();
                                    return;
                                case 'day':
                                    advdate(amount,"day");
                                    weather("random");
                                    moon(state.MWCalendar.now.prevType);
                                    calmenu();
                                    chkalarms();
                                    return;
                                case 'week':
                                    advdate(amount*7,"day");
                                    weather("random");
                                    moon(state.MWCalendar.now.prevType);
                                    calmenu();
                                    chkalarms();
                                    return;
                                case 'month':
                                    advdate(amount,"month");
                                    weather("random");
                                    moon(state.MWCalendar.now.prevType);
                                    calmenu();
                                    chkalarms();
                                    return;
                                case 'year':
                                    advdate(amount,"year");
                                    weather("random");
                                    moon(state.MWCalendar.now.prevType);
                                    calmenu();
                                    chkalarms();
                                    return;
                            }
                        } else if (args[1]=="reset") {
                            if (args[2]==undefined) {
                                reset();
                            } else if (args[2]=="Yes") {
                                checkInstall(true);
                                calmenu();
                            } else if (args[2]=="No") {
                                calmenu();
                            }
                        } else if (args[1].includes("set")) {
                            let type=String(args[1].toLowerCase()).replace("set ","");
                            let amount=Number(args[2]);
                            if (type.includes("hour")) {
                                state.MWCalendar.now.hour=amount;
                            } else if (type.includes("minute")) {
                                state.MWCalendar.now.minute=amount;
                            } else if (type.includes("day")) {
                                switch (Number(state.MWCalendar.now.world)) {
                                    case 1:
                                        getFaerunOrdinal(amount,state.MWCalendar.now.month);
                                        weather("random");
                                        moon(state.MWCalendar.now.prevType);
                                        calmenu();
                                        chkalarms();
                                        return;
                                    case 2:
                                        //getGreyhawkOrdinal(amount,state.MWCalendar.now.month);
                                        return;
                                    case 3:
                                        //getModernOrdinal(amount,state.MWCalendar.now.month);
                                        return;
                                    case 4:
                                        getEberronOrdinal(amount,state.MWCalendar.now.month);
                                        weather("random");
                                        moon(state.MWCalendar.now.prevType);
                                        calmenu();
                                        chkalarms();
                                        return;
                                    case 5:
                                        //getTalOrdinal(amount,state.MWCalendar.now.month);
                                        return;
                                }
                            } else if (type.includes("month")) {
                                let month=args[2];
                                switch (Number(state.MWCalendar.now.world)) {
                                    case 1:
                                        getFaerunOrdinal(state.MWCalendar.now.day,month);
                                        weather("random");
                                        moon(state.MWCalendar.now.prevType);
                                        calmenu();
                                        chkalarms();
                                        return;
                                    case 2:
                                        //getGreyhawkOrdinal(state.MWCalendar.now.day,month);
                                        return;
                                    case 3:
                                        //getModernOrdinal(state.MWCalendar.now.day,month);
                                        return;
                                    case 4:
                                        getEberronOrdinal(state.MWCalendar.now.day,month);
                                        weather("random");
                                        moon(state.MWCalendar.now.prevType);
                                        calmenu();
                                        chkalarms();
                                        return;
                                    case 5:
                                        //getTalOrdinal(state.MWCalendar.now.day,month);
                                        return;
                                }
                            } else if (type.includes("year")) {
                                state.MWCalendar.now.year=Number(args[2]);
                                weather("random");
                                moon(state.MWCalendar.now.prevType);
                                calmenu();
                                chkalarms();
                            }
                        } else if (args[1].includes("toggle")) {
                            let type=args[1].replace("toggle ","");
                            if (type=="weather") {
                                if (state.MWCalendar.now.wtype=="ON") {
                                    state.MWCalendar.now.wtype="OFF";
                                } else if (state.MWCalendar.now.wtype=="OFF") {
                                    state.MWCalendar.now.wtype="ON";
                                }
                            } else if (type=="moon") {
                                if (state.MWCalendar.now.mtype=="ON") {
                                    state.MWCalendar.now.mtype="OFF";
                                } else if (state.MWCalendar.now.mtype=="OFF") {
                                    state.MWCalendar.now.mtype="ON";
                                }
                            }
                            calmenu();
                            chkalarms();
                        } else if (args[1].includes("weather")) {
                            weather((args[1].toLowerCase()).replace("weather ",""));
                            calmenu();
                            chkalarms();
                        } else if (args[1].includes("moon")) {
                            let type=args[1].toLowerCase().replace("moon ","");
                            if (type=="normal" || type=="random") {
                                state.MWCalendar.now.prevType=type;
                            } else if (type!=="" && type!==" ") {
                                state.MWCalendar.now.prevType="custom";
                            }
                            moon(type);
                            calmenu();
                            chkalarms();
                        } else if (args[1].includes("enc")) {
                            encounter();
                            calmenu();
                            chkalarms();
                        }
                    }
                    return;
                case '!alarm':
                    if (args[1]!==undefined) {
                        if (args[1]=="new") {
                            if (args[2]==undefined) {
                                sendChat("Multi-World Calendar","/w gm You must define a Title for your Alarm!")
                            } else {
                                let title;
                                let date;
                                let time;
                                for (let i=2;i<=args.length-1;i++) {
                                    if (args[i].includes("title")) {
                                        title=args[i].replace("title ","");
                                    } else if (args[i].includes("date")) {
                                        date=args[i].replace("date ","");
                                    } else if (args[i].includes("time")) {
                                        time=args[i].replace("time ","");
                                    }
                                }
                                createAlarm(title,date,time);
                            }
                        } else if (args[1].includes("set")) {
                            let alarmnum=Number(args[1].replace("set ",""));
                            let title;
                            let date;
                            let time;
                            for (let i=2;i<=args.length-1;i++) {
                                if (args[i].includes("title")) {
                                    title=args[i].replace("title ","");
                                } else if (args[i].includes("date")) {
                                    date=args[i].replace("date ","");
                                } else if (args[i].includes("time")) {
                                    time=args[i].replace("time ","");
                                }
                            }
                            editAlarm(alarmnum,title,date,time);
                        } else {
                            alarmMenu(Number(args[1]));
                        }
                    } else if (args[1]==undefined) {
                        alarmMenu(args[1]);
                    }
                    return;
                case '!showcal':
                    showcal();
                    return;
            }
        }
        switch (args[0]) {
            case '!mwcal':
                showcal(msg);
                return;
        }
    },

    calmenu = function() {
        var divstyle = 'style="width: 220px; border: 1px solid black; background-color: #ffffff; padding: 5px;"';
        var astyle1 = 'style="text-align:center; border: 1px solid black; margin: 1px; background-color: #7E2D40; border-radius: 4px;  box-shadow: 1px 1px 1px #707070; width: 100px;';
        var astyle2 = 'style="text-align:center; border: 1px solid black; margin: 1px; background-color: #7E2D40; border-radius: 4px;  box-shadow: 1px 1px 1px #707070; width: 150px;';
        var tablestyle = 'style="text-align:center;"';
        var arrowstyle = 'style="border: none; border-top: 3px solid transparent; border-bottom: 3px solid transparent; border-left: 195px solid rgb(126, 45, 64); margin-bottom: 2px; margin-top: 2px;"';
        var headstyle = 'style="color: rgb(126, 45, 64); font-size: 18px; text-align: left; font-variant: small-caps; font-family: Times, serif;"';
        var substyle = 'style="font-size: 11px; line-height: 13px; margin-top: -3px; font-style: italic;"';
        var tdstyle = 'style="padding: 2px; padding-left: 5px; border: none;"';
        var world=getWorld();
        var moMenu = getMoMenu();
        var ordinal = state.MWCalendar.now.ordinal;
        var nowDate;
        switch (Number(state.MWCalendar.now.world)) {
            case 1:
                nowDate=getFaerunDate(ordinal).split(',');
                break;
            case 2:
                //nowDate=getGreyhawkDate(ordinal).split(',');
                break;
            case 3:
                //nowDate=getModernDate(ordinal).split(',');
                break;
            case 4:
                nowDate=getEberronDate(ordinal).split(',');
                break;
            case 5:
                //nowDate=getTalDate(ordinal).split(',');
                break;
        }
        var month=nowDate[0];
        var day=nowDate[1];
        state.MWCalendar.now.day=day;
        state.MWCalendar.now.month=month;
        var suffix=getSuffix(day);
        var hour=state.MWCalendar.now.hour;
        var min=state.MWCalendar.now.minute;
        var year = state.MWCalendar.now.year;
        if (hour<10) {
            hour="0"+hour;
        }
        if (min<10) {
            min="0"+min;
        }
        let weather;
        switch (state.MWCalendar.now.wtype) {
            case 'ON':
                weather=state.MWCalendar.now.weather;
                break;
            case 'OFF':
                weather=undefined;
                break;
        }
        let moon;
        switch (state.MWCalendar.now.mtype) {
            case 'ON':
                moon=state.MWCalendar.now.moon;
                break;
            case 'OFF':
                moon=undefined;
                break;
        }
        if (state.MWCalendar.now.wtype=="ON" && state.MWCalendar.now.mtype=="ON") {
            sendChat("Multi-World Calendar","/w gm <div " + divstyle + ">" + //--
                '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
                '<div ' + substyle + '>Menu</div>' + //--
                '<div ' + arrowstyle + '></div>' + //--
                '<table>' + //--
                '<tr><td ' + tdstyle + '>World: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --world ?{World?|Faerûn|Greyhawk|Modern|Eberron|Tal\'Dorei|Random}">' + world + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Day: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Day --?{Day?|1}">' + day + suffix + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Month: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Month --' + moMenu + '">' + month + '</a></td></tr>' + //-- 
                '<tr><td ' + tdstyle + '>Year: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Year --?{Year?|'+year+'}">' + year + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Hour: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Hour --?{Hour?|'+state.MWCalendar.now.hour+'}">' + hour + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Minute: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Minute --?{Minute?|'+state.MWCalendar.now.minute+'}">' + min + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Moon: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --moon ?{Moon?|Full Moon|Waning Gibbous|Last Quarter|Waning Crescent|New Moon|Waxing Crescent|First Quarter|Waxing Gibbous|Random|Normal}">' + moon + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Weather: </td><td ' + tdstyle + '>' + weather + '</td></tr>' + //--
                '</table>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --adv ?{Type?|Short Rest|Long Rest|Hour|Minute|Day|Week|Month|Year} --?{Amount?|1}">Advance the Date</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --enc">Roll Encounter</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --toggle weather">Toggle Weather Display</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --toggle moon">Toggle Moon Display</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --weather ?{Weather?|Put Weather here, type Random to randomise}">Set Weather</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!alarm --new --title ?{Title?|Insert Title} --date ?{Date?|DD.MM.YYYY} --time ?{Time?|HH:MM}">Create Alarm</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!showcal">Show to Players</a></div>' + //--
                '<br><br>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --reset">Reset Calendar</a></div>' + //--
                '</div>'
            );
        } else if (state.MWCalendar.now.wtype=="ON" && state.MWCalendar.now.mtype=="OFF") {
            sendChat("Multi-World Calendar","/w gm <div " + divstyle + ">" + //--
                '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
                '<div ' + substyle + '>Menu</div>' + //--
                '<div ' + arrowstyle + '></div>' + //--
                '<table>' + //--
                '<tr><td ' + tdstyle + '>World: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --world ?{World?|Faerûn|Greyhawk|Modern|Eberron|Tal\'Dorei|Random}">' + world + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Day: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Day --?{Day?|1}">' + day + suffix + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Month: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Month --' + moMenu + '">' + month + '</a></td></tr>' + //-- 
                '<tr><td ' + tdstyle + '>Year: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Year --?{Year?|'+year+'}">' + year + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Hour: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Hour --?{Hour?|'+state.MWCalendar.now.hour+'}">' + hour + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Minute: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Minute --?{Minute?|'+state.MWCalendar.now.minute+'}">' + min + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Weather: </td><td ' + tdstyle + '>' + weather + '</td></tr>' + //--
                '</table>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --adv ?{Type?|Short Rest|Long Rest|Hour|Minute|Day|Week|Month|Year} --?{Amount?|1}">Advance the Date</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --enc">Roll Encounter</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --toggle weather">Toggle Weather Display</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --toggle moon">Toggle Moon Display</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --weather ?{Weather?|Put Weather here, type Random to randomise}">Set Weather</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!alarm --new --title ?{Title?|Insert Title} --date ?{Date?|DD.MM.YYYY} --time ?{Time?|HH:MM}">Create Alarm</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!showcal">Show to Players</a></div>' + //--
                '<br><br>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --reset">Reset Calendar</a></div>' + //--
                '</div>'
            );
        } else if (state.MWCalendar.now.wtype=="OFF" && state.MWCalendar.now.mtype=="ON") {
            sendChat("Multi-World Calendar","/w gm <div " + divstyle + ">" + //--
                '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
                '<div ' + substyle + '>Menu</div>' + //--
                '<div ' + arrowstyle + '></div>' + //--
                '<table>' + //--
                '<tr><td ' + tdstyle + '>World: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --world ?{World?|Faerûn|Greyhawk|Modern|Eberron|Tal\'Dorei|Random}">' + world + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Day: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Day --?{Day?|1}">' + day + suffix + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Month: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Month --' + moMenu + '">' + month + '</a></td></tr>' + //-- 
                '<tr><td ' + tdstyle + '>Year: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Year --?{Year?|'+year+'}">' + year + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Hour: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Hour --?{Hour?|'+state.MWCalendar.now.hour+'}">' + hour + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Minute: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Minute --?{Minute?|'+state.MWCalendar.now.minute+'}">' + min + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Moon: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --moon ?{Moon?|Full Moon|Waning Gibbous|Last Quarter|Waning Crescent|New Moon|Waxing Crescent|First Quarter|Waxing Gibbous|Random|Normal}">' + moon + '</a></td></tr>' + //--
                '</table>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --adv ?{Type?|Short Rest|Long Rest|Hour|Minute|Day|Week|Month|Year} --?{Amount?|1}">Advance the Date</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --enc">Roll Encounter</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --toggle weather">Toggle Weather Display</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --toggle moon">Toggle Moon Display</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --weather ?{Weather?|Put Weather here, type Random to randomise}">Set Weather</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!alarm --new --title ?{Title?|Insert Title} --date ?{Date?|DD.MM.YYYY} --time ?{Time?|HH:MM}">Create Alarm</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!showcal">Show to Players</a></div>' + //--
                '<br><br>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --reset">Reset Calendar</a></div>' + //--
                '</div>'
            );
        } else if (state.MWCalendar.now.wtype=="OFF" && state.MWCalendar.now.mtype=="OFF") {
            sendChat("Multi-World Calendar","/w gm <div " + divstyle + ">" + //--
                '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
                '<div ' + substyle + '>Menu</div>' + //--
                '<div ' + arrowstyle + '></div>' + //--
                '<table>' + //--
                '<tr><td ' + tdstyle + '>World: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --world ?{World?|Faerûn|Greyhawk|Modern|Eberron|Tal\'Dorei|Random}">' + world + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Day: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Day --?{Day?|1}">' + day + suffix + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Month: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Month --' + moMenu + '">' + month + '</a></td></tr>' + //-- 
                '<tr><td ' + tdstyle + '>Year: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Year --?{Year?|'+year+'}">' + year + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Hour: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Hour --?{Hour?|'+state.MWCalendar.now.hour+'}">' + hour + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Minute: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!mwcal --set Minute --?{Minute?|'+state.MWCalendar.now.minute+'}">' + min + '</a></td></tr>' + //--
                '</table>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --adv ?{Type?|Short Rest|Long Rest|Hour|Minute|Day|Week|Month|Year} --?{Amount?|1}">Advance the Date</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --enc">Roll Encounter</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --toggle weather">Toggle Weather Display</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --toggle moon">Toggle Moon Display</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --weather ?{Weather?|Put Weather here, type Random to randomise}">Set Weather</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!alarm --new --title ?{Title?|Insert Title} --date ?{Date?|DD.MM.YYYY} --time ?{Time?|HH:MM}">Create Alarm</a></div>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!showcal">Show to Players</a></div>' + //--
                '<br><br>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --reset">Reset Calendar</a></div>' + //--
                '</div>'
            );
        }
    },

    alarmMenu = function(num) {
        var divstyle = 'style="width: 220px; border: 1px solid black; background-color: #ffffff; padding: 5px;"';
        var astyle1 = 'style="text-align:center; border: 1px solid black; margin: 1px; background-color: #7E2D40; border-radius: 4px;  box-shadow: 1px 1px 1px #707070; width: 100px;';
        var astyle2 = 'style="text-align:center; border: 1px solid black; margin: 1px; background-color: #7E2D40; border-radius: 4px;  box-shadow: 1px 1px 1px #707070; width: 150px;';
        var tablestyle = 'style="text-align:center;"';
        var arrowstyle = 'style="border: none; border-top: 3px solid transparent; border-bottom: 3px solid transparent; border-left: 195px solid rgb(126, 45, 64); margin-bottom: 2px; margin-top: 2px;"';
        var headstyle = 'style="color: rgb(126, 45, 64); font-size: 18px; text-align: left; font-variant: small-caps; font-family: Times, serif;"';
        var substyle = 'style="font-size: 11px; line-height: 13px; margin-top: -3px; font-style: italic;"';
        var tdstyle = 'text-align:right;"';
        let alarm=state.Alarm[num];
        let len=state.Alarm.length;
        if (alarm==undefined) {
            if (len==undefined || len==0) {
                sendChat("Multi-World Calendar","/w gm <div " + divstyle + ">" + //--
                    '<div ' + headstyle + '>Alarm</div>' + //--
                    '<div ' + substyle + '>Menu</div>' + //--
                    '<div ' + arrowstyle + '></div>' + //--
                    '<div style="text-align:center;">Alarm: None</div>' + //--
                    '<br><br>' + //--
                    '<div style="text-align:center;"><a ' + astyle2 + '" href="!alarm --new --title ?{Title?|Insert Title} --date ?{Date?|DD.MM.YYYY} --time ?{Time?|HH:MM}">Create Alarm</a></div>' + //--
                    '</div>'
                );
            } else if (len>=1) {
                let list=[];
                for (let i=0;i<len;i++) {
                    list[i]=i;
                }
                for (let i=0;i<len;i++) {
                    list=String(list).replace(",","|");
                }
                sendChat("Multi-World Calendar","/w gm <div " + divstyle + ">" + //--
                    '<div ' + headstyle + '>Alarm</div>' + //--
                    '<div ' + substyle + '>Menu</div>' + //--
                    '<div ' + arrowstyle + '></div>' + //--
                    '<table' + tablestyle + '>' + //--
                    '<tr><td>Alarm: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!alarm --?{Alarm?|' + list + '}">None</td></tr>' + //--
                    '</table>' + //--
                    '<br><br>' + //--
                    '<div style="text-align:center;"><a ' + astyle2 + '" href="!alarm --new --title ?{Title?|Insert Title} --date ?{Date?|DD.MM.YYYY} --time ?{Time?|HH:MM}">Create Alarm</a></div>' + //--
                    '</div>'
                );
            }
        } else {
            let title=alarm.title;
            let date=alarm.date;
            let time=alarm.time;
            let splitDate=date.split('.');
            let splitTime=time.split(':');
            sendChat("Multi-World Calendar","/w gm <div " + divstyle + ">" + //--
                '<div ' + headstyle + '>Alarm</div>' + //--
                '<div ' + substyle + '>Menu</div>' + //--
                '<div ' + arrowstyle + '></div>' + //--
                '<table>' + //--
                '<tr><td ' + tdstyle + '>Alarm: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!alarm --?{Number?|'+num+'}">' + num + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Title: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!alarm --' + num + ' --title ?{Title?|'+title+'}">' + title + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Date: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!alarm --' + num + ' --date ?{Day?|'+splitDate[0]+'}.?{Month?|'+splitDate[1]+'}.?{Year?|'+splitDate[2]+'}">' + date + '</a></td></tr>' + //--
                '<tr><td ' + tdstyle + '>Time: </td><td ' + tdstyle + '><a ' + astyle1 + '" href="!alarm --' + num + ' --time ?{Hour?|'+splitTime[0]+'}:?{Minute?|'+splitTime[1]+'}">' + time + '</a></td></tr>' + //--
                '</table>' + //--
                '<br><br>' + //--
                '<div style="text-align:center;"><a ' + astyle2 + '" href="!alarm --new --title ?{Title?|Insert Title} --date ?{Date?|DD.MM.YYYY} --time ?{HH:MM}">Create Alarm</a></div>' + //--
                '</div>'
            );
        }
    },

    createAlarm = function(title,date,time,world) {
        let num=state.Alarm.length;
        date=date.split('.');
        let day=Number(date[0]);
        let month=Number(date[1]);
        let year=Number(date[2]);
        time=time.split(':');
        let hour=Number(time[0]);
        let min=Number(time[1]);
        world=state.MWCalendar.now.world;
        month=getMonth(month,world);
        state.Alarm[num]={
            day: day,
            month: month,
            year: year,
            hour: hour,
            minute: min,
            title: title,
            world: world
        };
        sendChat("Multi-World Calendar","/w gm Alarm #"+num+": "+title+" created!")
    },

    editAlarm = function(num,title,date,time) {
        num=Number(num);
        let alarm=state.Alarm[num];
        if (alarm==undefined) {
            sendChat("Multi-World Calendar","/w gm No such Alarm exists!");
        } else {
            let hand=findObjs({
                _type: "handout",
                name: "Alarm #"+num
            }, {caseInsensitive: true})[0];
            if (hand==undefined) {
                hand=createObj("handout",{
                    name: "Alarm #"+num
                });
                if (title!==undefined && title!=="" && title!==" ") {
                    hand.set("notes",title);
                }
                let datetime;
                if (date!==undefined) {
                    datetime=date+";";
                    if (time!==undefined) {
                        datetime+=time;
                    }
                } else if (date==undefined) {
                    if (time!==undefined) {
                        datetime=";"+time;
                    }
                }
                hand.set("gmnotes",datetime);
            } else if (hand!==undefined) {
                if (title!==undefined) {
                    hand.set("notes",title);
                }
                hand.get("gmnotes",function(gmnotes) {
                    let datetime=String(gmnotes).split(";")
                    let rdate=datetime[0];
                    let rtime=datetime[1];
                    if (date!==undefined) {
                        rdate=date;
                    }
                    if (time!==undefined) {
                        rtime=time;
                    }
                    if (rdate==undefined) {
                        rdate="";
                    }
                    if (rtime==undefined) {
                        rtime="";
                    }
                    datetime=rdate+";"+rtime;
                    hand.set("gmnotes",datetime);
                });
            }
        }
    },

    getMonth = function(monnum,world) {
        if (state.MWCalendar.now.world==1) {

        } else if (state.MWCalendar.now.world==4) {

        }
    },

    showcal = function(msg) {
        var rmoon;
        moon(state.MWCalendar.now.moon);
        switch (Number(state.MWCalendar.now.world)) {
            case 1:
                if (state.MWCalendar.now.mtype=="ON") {
                    rmoon = '<table style = "border: none;"><tr><td style="border: none; padding: 2px; padding-left: 5px;">Moon:</td><td style="border: none; padding: 2px; padding-left: 5px;">'+state.MWCalendar.now.moonImg+'</table>';
                } else {
                    rmoon=undefined;
                }
            break;
            case 2:
                if (state.MWCalendar.now.mtype=="ON") {
                    rmoon = '<table style = "border: none;"><tr><td style="border: none; padding: 2px; padding-left: 5px;">Moon:</td><td style="border: none; padding: 2px; padding-left: 5px;">'+state.MWCalendar.now.moonImg+'</table>';
                } else {
                    rmoon=undefined;
                }
            break;
        }
        var month=state.MWCalendar.now.month;
        var day=state.MWCalendar.now.day;
        var suffix=getSuffix(day);
        var world=getWorld();
        var divstyle = 'style="width: 189px; border: 1px solid black; background-color: #ffffff; padding: 5px;"'
        var arrowstyle = 'style="border: none; border-top: 3px solid transparent; border-bottom: 3px solid transparent; border-left: 195px solid rgb(126, 45, 64); margin-bottom: 2px; margin-top: 2px;"';
        var headstyle = 'style="color: rgb(126, 45, 64); font-size: 18px; text-align: left; font-variant: small-caps; font-family: Times, serif;"';
        var substyle = 'style="font-size: 11px; line-height: 13px; margin-top: -3px; font-style: italic;"';
        let whisper="";
        let hour=state.MWCalendar.now.hour;
        let minute=state.MWCalendar.now.minute;
        let alarmmsg=checkMonthAlarms();
        let weather;
        if (hour<=9) {
            hour="0"+hour;
        }
        if (minute<=9) {
            minute="0"+minute;
        }
        if (msg) {
            whisper="/w "+msg.who+" ";
        }
        if (state.MWCalendar.now.wtype=="ON") {
            weather=state.MWCalendar.now.weather;
            if (state.MWCalendar.now.mtype=="ON") {
                sendChat("Multi-World Calendar",whisper+"<div " + divstyle + ">" + //--
                    '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
                    '<div ' + substyle + '>Player View</div>' + //--
                    '<div ' + arrowstyle + '></div>' + //--
                    '<div style="text-align:center;">World: ' + world + '</div>' + //--
                    day + suffix + ' of ' + month + ', ' + state.MWCalendar.now.year + //--
                    '<br>Time: ' + hour + ':' + minute + //--
                    '<br><br>Today\'s Weather:<br>' + state.MWCalendar.now.weather + //--
                    rmoon + //--
                    alarmmsg + //--
                    '</div>'
                );
            } else {
                sendChat("Multi-World Calendar",whisper+"<div " + divstyle + ">" + //--
                    '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
                    '<div ' + substyle + '>Player View</div>' + //--
                    '<div ' + arrowstyle + '></div>' + //--
                    '<div style="text-align:center;">World: ' + world + '</div>' + //--
                    day + suffix + ' of ' + month + ', ' + state.MWCalendar.now.year + //--
                    '<br>Time: ' + hour + ':' + minute + //--
                    '<br><br>Today\'s Weather:<br>' + state.MWCalendar.now.weather + //--
                    alarmmsg + //--
                    '</div>'
                );
            }
        } else if (state.MWCalendar.now.wtype=="OFF") {
            weather=undefined;
            if (state.MWCalendar.now.mtype=="ON") {
                sendChat("Multi-World Calendar",whisper+"<div " + divstyle + ">" + //--
                    '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
                    '<div ' + substyle + '>Player View</div>' + //--
                    '<div ' + arrowstyle + '></div>' + //--
                    '<div style="text-align:center;">World: ' + world + '</div>' + //--
                    day + suffix + ' of ' + month + ', ' + state.MWCalendar.now.year + //--
                    '<br>Time: ' + hour + ':' + minute + //--
                    rmoon + //--
                    alarmmsg + //--
                    '</div>'
                );
            } else {
                sendChat("Multi-World Calendar",whisper+"<div " + divstyle + ">" + //--
                    '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
                    '<div ' + substyle + '>Player View</div>' + //--
                    '<div ' + arrowstyle + '></div>' + //--
                    '<div style="text-align:center;">World: ' + world + '</div>' + //--
                    day + suffix + ' of ' + month + ', ' + state.MWCalendar.now.year + //--
                    '<br>Time: ' + hour + ':' + minute + //--
                    alarmmsg + //--
                    '</div>'
                );
            }
        }
    },

    checkMonthAlarms = function() {
        var year=state.MWCalendar.now.year;
        var month=state.MWCalendar.now.month;
        var day=state.MWCalendar.now.day;
        let hour=state.MWCalendar.now.hour;
        let min=state.MWCalendar.now.min;
        let alarmmsg="";
        let alarmList=state.Alarm;
        for (let i=0;i<alarmList.length;i++) {
            let alarm=alarmList[i];
            let aday=alarm.day;
            let amonth=alarm.month;
            let ayear=alarm.year;
            let ahour=alarm.hour;
            let amin=alarm.min;
            let title=alarm.title;
            if (state.MWCalendar.now.world==1) {
                if (Number(amonth)==1) {
                    amonth="Hammer";
                } else if (Number(amonth)==2) {
                    amonth="Alturiak";
                } else if (Number(amonth)==3) {
                    amonth="Ches";
                } else if (Number(amonth)==4) {
                    amonth="Tarsakh";
                } else if (Number(amonth)==5) {
                    amonth="Mirtul";
                } else if (Number(amonth)==6) {
                    amonth="Kythorn";
                } else if (Number(amonth)==7) {
                    amonth="Flamerule";
                } else if (Number(amonth)==8) {
                    amonth="Eleasis";
                } else if (Number(amonth)==9) {
                    amonth="Eleint";
                } else if (Number(amonth)==10) {
                    amonth="Marpenoth";
                } else if (Number(amonth)==11) {
                    amonth="Uktar";
                } else if (Number(amonth==12)) {
                    amonth="Nightal";
                }
                if (Number(ayear)==year) {
                    if (amonth==month) {
                        if (aday<day) {
                            let trueday=day-aday;
                            alarmmsg+='<br><br>'+title+' (in '+trueday+' days)';
                        } else if (aday==day) {
                            if (ahour<hour) {
                                let truehour=hour-ahour;
                                if (amin<min) {
                                    let truemin=min-amin;
                                    alarmmsg+='<br><br>'+title+' (in '+truehour+' hours '+truemin+' minutes)';
                                } else if (amin==min) {
                                    alarmmsg+='<br><br>'+title+' (in '+truehour+' hours)';
                                } else if (amin>min) {
                                    truehour-=1;
                                    let truemin=60-amin;
                                    alarmmsg+='<br><br>'+title+' (in '+truehour+' hours '+truemin+' minutes)';
                                }
                            }
                        }
                    }
                }
            } else if (state.MWCalendar.now.world==4) {
                if (Number(amonth)==1) {
                    amonth="Zarantyr";
                } else if (Number(amonth)==2) {
                    amonth="Olarune";
                } else if (Number(amonth)==3) {
                    amonth="Therendor";
                } else if (Number(amonth)==4) {
                    amonth="Eyre";
                } else if (Number(amonth)==5) {
                    amonth="Dravago";
                } else if (Number(amonth)==6) {
                    amonth="Nymm";
                } else if (Number(amonth)==7) {
                    amonth="Lharvion";
                } else if (Number(amonth)==8) {
                    amonth="Barrakas";
                } else if (Number(amonth)==9) {
                    amonth="Rhaan";
                } else if (Number(amonth)==10) {
                    amonth="Sypheros";
                } else if (Number(amonth)==11) {
                    amonth="Aryth";
                } else if (Number(amonth==12)) {
                    amonth="Vult";
                }
                if (Number(ayear)==year) {
                    if (amonth==month) {
                        if (aday<day) {
                            let trueday=day-aday;
                            alarmmsg+='<br><br>'+title+' (in '+trueday+' days)';
                        } else if (aday==day) {
                            if (ahour<hour) {
                                let truehour=hour-ahour;
                                if (amin<min) {
                                    let truemin=min-amin;
                                    alarmmsg+='<br><br>'+title+' (in '+truehour+' hours '+truemin+' minutes)';
                                } else if (amin==min) {
                                    alarmmsg+='<br><br>'+title+' (in '+truehour+' hours)';
                                } else if (amin>min) {
                                    truehour-=1;
                                    let truemin=60-amin;
                                    alarmmsg+='<br><br>'+title+' (in '+truehour+' hours '+truemin+' minutes)';
                                }
                            }
                        }
                    }
                }
            }
        }
        return alarmmsg;
    },

    chkalarms = function() {
        let alarmList=state.Alarm;
        for (let i=0;i<alarmList.length;i++) {
            let alarm=alarmList[i];
            let name=alarm.title;
            let day=alarm.day;
            let month=alarm.month;
            let year=alarm.year;
            let hour=alarm.hour;
            let min=alarm.min;
            if (state.MWCalendar.now.world==1) {
                if (month=="1"||month=="01"||month==1) {
                    month="Hammer";
                } else if (month=="2"||month=="02"||month==2) {
                    month="Alturiak";
                } else if (month=="3"||month=="03"||month==3) {
                    month="Ches";
                } else if (month=="4"||month=="04"||month==4) {
                    month="Tarsakh";
                } else if (month=="5"||month=="05"||month==5) {
                    month="Mirtul";
                } else if (month=="6"||month=="06"||month==6) {
                    month="Kythorn";
                } else if (month=="7"||month=="07"||month==7) {
                    month="Flamerule";
                } else if (month=="8"||month=="08"||month==8) {
                    month="Eleasis";
                } else if (month=="9"||month=="09"||month==9) {
                    month="Eleint";
                } else if (month=="10"||month==10) {
                    month="Marpenoth";
                } else if (month=="11"||month==11) {
                    month="Uktar";
                } else if (month=="12"||month==12) {
                    month="Nightal";
                }
                if (hour!==undefined) {
                    if (year==state.MWCalendar.now.year) {
                        if (month==state.MWCalendar.now.month) {
                            if (day>=state.MWCalendar.now.day) {
                                if (hour>=state.MWCalendar.now.hour) {
                                    if (minute>=state.MWCalendar.now.minute) {
                                        sendChat("Multi-World Calendar","/w gm "+name+": "+title+" triggered!");
                                        state.Alarm.splice(i);
                                    }
                                }
                            }
                        }
                    }
                } else if (hour==undefined) {
                    if (year==state.MWCalendar.now.year) {
                        if (month==state.MWCalendar.now.month) {
                            if (day>=state.MWCalendar.now.day) {
                                sendChat("Multi-World Calendar","/w gm "+name+": "+title+" triggered!");
                                state.Alarm.splice(i);
                            }
                        }
                    }
                }
            } else if (state.MWCalendar.now.world==4) {
                if (month=="1"||month=="01"||month==1) {
                    month="Zarantyr";
                } else if (month=="2"||month=="02"||month==2) {
                    month="Olarune";
                } else if (month=="3"||month=="03"||month==3) {
                    month="Therendor";
                } else if (month=="4"||month=="04"||month==4) {
                    month="Eyre";
                } else if (month=="5"||month=="05"||month==5) {
                    month="Dravago";
                } else if (month=="6"||month=="06"||month==6) {
                    month="Nymm";
                } else if (month=="7"||month=="07"||month==7) {
                    month="Lharvion";
                } else if (month=="8"||month=="08"||month==8) {
                    month="Barrakas";
                } else if (month=="9"||month=="09"||month==9) {
                    month="Rhaan";
                } else if (month=="10"||month==10) {
                    month="Sypheros";
                } else if (month=="11"||month==11) {
                    month="Aryth";
                } else if (month=="12"||month==12) {
                    month="Vult";
                }
                if (hour!==undefined) {
                    if (year==state.MWCalendar.now.year) {
                        if (month==state.MWCalendar.now.month) {
                            if (day>=state.MWCalendar.now.day) {
                                if (hour>=state.MWCalendar.now.hour) {
                                    if (minute>=state.MWCalendar.now.minute) {
                                        sendChat("Multi-World Calendar","/w gm "+name+": "+title+" triggered!");
                                        state.Alarm.splice(i);
                                    }
                                }
                            }
                        }
                    }
                } else if (hour==undefined) {
                    if (year==state.MWCalendar.now.year) {
                        if (month==state.MWCalendar.now.month) {
                            if (day>=state.MWCalendar.now.day) {
                                sendChat("Multi-World Calendar","/w gm "+name+": "+title+" triggered!");
                                state.Alarm.splice(i);
                            }
                        }
                    }
                }
            }
        }
    },

    addtime = function(amount,type) {
        var hour=state.MWCalendar.now.hour;
        var minute=state.MWCalendar.now.minute;
        var day=state.MWCalendar.now.ordinal;
        var year=state.MWCalendar.now.year;
        amount=Number(amount);
        if (type=="minute") {
            var newmin=Number(minute)+Number(amount);
            while (newmin>59) {
                newmin-=60;
                hour+=1;
            }
            while (hour>24) {
                hour-=24;
                day++;
            }
            if (state.MWCalendar.now.world==1) {
                while (day>360) {
                    day-=360;
                    year++;
                }
            } else if (state.MWCalendar.now.world==4) {
                while (day>336) {
                    day-=336;
                    year++;
                }
            }
            minute=newmin;
        } else if (type=="hour") {
            var newhour=Number(hour)+Number(amount);
            while (newhour>24) {
                newhour-=24;
                day++;
            }
            if (state.MWCalendar.now.world==1) {
                while (day>360) {
                    day-=360;
                    year++;
                }
            } else if (state.MWCalendar.now.world==4) {
                while (day>336) {
                    day-=336;
                    year++;
                }
            }
            hour=newhour;
        }
        state.MWCalendar.now.hour=hour;
        log(hour);
        log(state.MWCalendar.now.hour);
        state.MWCalendar.now.minute=minute;
        state.MWCalendar.now.ordinal=day;
        state.MWCalendar.now.year=year;
    },

    advdate = function(amount,type) {
        var ordinal=state.MWCalendar.now.ordinal;
        var day=state.MWCalendar.now.day;
        var month=state.MWCalendar.now.month;
        var year=state.MWCalendar.now.year;
        var monthlist;
        var monthNum;
        amount=Number(amount);
        switch (state.MWCalendar.now.world) {
            case 1:
                monthlist=["Hammer","Alturiak","Ches","Tarsakh","Mirtul","Kythorn","Flamerule","Eleasias","Eleint","Marpenoth","Uktar","Nightal"];
                for (let i=0;i<monthlist.length;i++) {
                    if (month==monthlist[i]) {
                        monthNum=i+1;
                    }
                }
                if (type=="day") {
                    ordinal+=amount;
                    while (ordinal>360) {
                        ordinal-=360;
                        year++;
                    }
                    day+=amount;
                    while (day>30) {
                        day-=30;
                        monthNum++;
                    }
                    while (monthNum>12) {
                        monthNum-=12;
                    }
                    month=monthlist[monthNum-1];
                } else if (type=="month") {
                    ordinal+=amount*30;
                    while (ordinal>360) {
                        ordinal-=360;
                        year++;
                    }
                    monthNum+=amount;
                    while (monthNum>12) {
                        monthNum-=12;
                    }
                    month=monthlist[monthNum-1];
                } else if (type=="year") {
                    year+=amount;
                }
                break;
            case 2:
                //Greyhawk Months
                break;
            case 3:
                //Modern Months
                break;
            case 4:
                //Eberron Months
                monthlist=["Zarantyr","Olarune","Therendor","Eyre","Dravago","Nymm","Lharvion","Barrakas","Rhaan","Sypheros","Aryth","Vult"];
                for (let i=0;i<monthlist.length;i++) {
                    if (month==monthlist[i]) {
                        monthNum=i+1;
                    }
                }
                if (type=="day") {
                    ordinal+=amount;
                    while (ordinal>360) {
                        ordinal-=360;
                        year++;
                    }
                    day+=amount;
                    while (day>28) {
                        day-=28;
                        monthNum++;
                    }
                    while (monthNum>12) {
                        monthNum-=12;
                    }
                    month=monthlist[monthNum-1];
                } else if (type=="month") {
                    ordinal+=amount*28;
                    while (ordinal>336) {
                        ordinal-=336;
                        year++;
                    }
                    monthNum+=amount;
                    while (monthNum>12) {
                        monthNum-=12;
                    }
                    month=monthlist[monthNum-1];
                } else if (type=="year") {
                    year+=amount;
                }
                break;
            case 5:
                //Tal Months
                break;
        }
        state.MWCalendar.now.ordinal=ordinal;
        state.MWCalendar.now.day=day;
        state.MWCalendar.now.month=month;
        state.MWCalendar.now.year=year;
    },

    getFaerunDate = function(ordinal) {
        var day=Number(ordinal);
        var date;
        var month;
        if (day>0 && day<=30) {
            month="Hammer"; 
            date=day;
        } else if (day>30 && day<=60) {
            month="Alturiak"; 
            date=day-30;
        } else if (day>60 && day<=90) {
            month="Ches";
            date=day-60;
        } else if (day>90 && day<=120) {
            month="Tarsakh";
            date=day-90;
        } else if (day>120 && day<=150) {
            month="Mirtul";
            date=day-120;
        } else if(day>150 && day<=180) {
            month="Kythorn";
            date=day-150;
        } else if(day>180 && day<=210) {
            month="Flamerule";
            date=day-180;
        } else if (day>210 && day<=240) {
            month="Eleasias"
            date=day-210;
        } else if (day>240 && day<=270){
            month="Eleint";
            date=day-240;
        } else if (day>270 && day<=300){
            month="Marpenoth";
            date=day-270;
        } else if (day>300 && day<=330){
            month="Uktar";
            date=day-300;
        } else if (day>330 && day<=360){
            month="Nightal";
            date=day-336;
        }
        state.MWCalendar.now.month=month;
        state.MWCalendar.now.day=date;
        var array=month+','+String(date);
        return array;
    },

    getGreyhawkDate = function(ordinal) {
        //Greyhawk Date
    },

    getModernDate = function(ordinal) {
        //Modern Date
    },

    getEberronDate = function(ordinal) {
        //Eberron Date
        var day=Number(ordinal);
        var date;
        var month;
        if (day>0 && day<=28) {
            month="Zarantyr";
            date=day;
        } else if (day<=56) {
            month="Olarune";
            date=day-28;
        } else if (day<=84) {
            month="Therendor";
            date=day-56;
        } else if (day<=112) {
            month="Eyre";
            date=day-84;
        } else if (day<=140) {
            month="Dravago";
            date=day-112;
        } else if (day<=168) {
            month="Nymm";
            date=day-140;
        } else if (day<=196) {
            month="Lharvion";
            date=day-168;
        } else if (day<=224) {
            month="Barrakas";
            date=day-196;
        } else if (day<=252) {
            month="Rhaan";
            date=day-224;
        } else if (day<=280) {
            month="Sypheros";
            date=day-252;
        } else if (day<=308) {
            month="Aryth";
            date=day-280;
        } else if (day<=336) {
            month="Vult";
            date=day-308;
        }
        state.MWCalendar.now.month=month;
        state.MWCalendar.now.day=date;
        var array=month+","+String(date);
        return array;
    },

    getTalDate = function(ordinal) {
        //Tal Date
    },

    getFaerunOrdinal = function(day,month) {
        let ordinal = state.MWCalendar.now.ordinal;
        switch (month) {
            case 'Hammer':
                ordinal=day;
                break;
            case 'Alturiak':
                ordinal=30+day;
                break;
            case 'Ches':
                ordinal=60+day;
                break;
            case 'Tarsakh':
                ordinal=90+day;
                break;
            case 'Mirtul':
                ordinal=120+day;
                break;
            case 'Kythorn':
                ordinal=150+day;
                break;
            case 'Flamerule':
                ordinal=180+day;
                break;
            case 'Eleasias':
                ordinal=210+day;
                break;
            case 'Eleint':
                ordinal=240+day;
                break;
            case 'Marpenoth':
                ordinal=270+day;
                break;
            case 'Uktar':
                ordinal=300+day;
                break;
            case 'Nightal':
                ordinal=330+day;
                break;
        }
        state.MWCalendar.now.ordinal=ordinal;
    },

    getGreyhawkOrdinal = function(day,month) {
        //Greyhawk Ordinal
    },

    getModernOrdinal = function(day,month) {
        //Modern Ordinal
    },

    getEberronOrdinal = function(day,month) {
        //Eberron Ordinal
        let ordinal;
        day=Number(day);
        switch (month) {
            case 'Zarantyr':
                ordinal=day;
            break;
            case 'Olarune':
                ordinal=28+day;
            break;
            case 'Therendor':
                ordinal=56+day;
            break;
            case 'Eyre':
                ordinal=84+day;
            break;
            case 'Dravago':
                ordinal=112+day;
            break;
            case 'Nymm':
                ordinal=140+day;
            break;
            case 'Lharvion':
                ordinal=168+day;
            break;
            case 'Barrakas':
                ordinal=196+day;
            break;
            case 'Rhaan':
                ordinal=224+day;
            break;
            case 'Sypheros':
                ordinal=252+day;
            break;
            case 'Aryth':
                ordinal=280+day;
            break;
            case 'Vult':
                ordinal=308+day;
            break;
        }
        state.MWCalendar.now.ordinal=ordinal;
    },

    getTalOrdinal = function(day,month) {
        //Tal Ordinal
    },

    getSuffix = function(day) {
        var suffix;
        if (String(day).includes("1") && day!==11) {
            suffix="st";
        } else if (String(day).includes("2") && day!==12) {
            suffix="nd";
        } else if (String(day).includes("3") && day!==13) {
            suffix="rd";
        } else {
            suffix="th";
        }
        return suffix;
    },

    weather = function(type) {
        if (state.MWCalendar.now.wtype=="ON") {
            var temp;
            var wind;
            var precip;
            var season;
            var ordinal=state.MWCalendar.now.ordinal;
            if (ordinal>330 || ordinal<=75) {
                season="Winter";
            } else if (ordinal<=170) {
                season="Spring";
            } else if (ordinal<=240) {
                season="Summer";
            } else if (ordinal<=330) {
                season="Fall";
            }
            if (type=="random") {
                var roll=randomInteger(21);
                if (roll>=15 && roll<=17) {
                    switch (season) {
                        case 'Winter':
                            temp="It is a bitterly cold winter day. ";
                            break;
                        case 'Spring':
                            temp="It is a cold spring day. ";
                            break;
                        case 'Summer':
                            temp="It is a cool summer day. ";
                            break;
                        case 'Fall':
                            temp="It is a cold fall day. ";
                            break;
                    }
                } else if (roll>=18 && roll<=20) {
                    switch (season) {
                        case 'Winter':
                            temp="It is a mild winter day. ";
                            break;
                        case 'Spring':
                            temp="It is a hot spring day. ";
                            break;
                        case 'Summer':
                            temp="It is a blisteringly hot summer day. ";
                            break;
                        case 'Fall':
                            temp="It is a hot fall day. ";
                            break;
                    }
                } else {
                    switch (season) {
                        case 'Winter':
                            temp="It is a cold winter day. ";
                            break;
                        case 'Spring':
                            temp="It is a mild spring day. ";
                            break;
                        case 'Summer':
                            temp="It is a warm summer day. ";
                            break;
                        case 'Fall':
                            temp="It is a mild fall day. ";
                            break;
                    }
                }
                roll=randomInteger(21);
                if (roll>=15 && roll<=17) {
                    wind="There is a light breeze and ";
                } else if (roll>=18 && roll<=20) {
                    wind="There is a howling wind and ";
                } else {
                    wind="The air is still and ";
                }
                roll=randomInteger(21);
                if (roll>=15 && roll<=17) {
                    if (season=="Winter") {
                        precip="snow falls softly on the ground.";
                    } else {
                        precip="it is raining lightly.";
                    }
                } else if (roll>=18 && roll<=20) {
                    if (season=="Winter") {
                        precip="snow falls thick and fast from the sky.";
                    } else {
                        precip="a torretial rain is falling.";
                    }
                } else {
                    roll=randomInteger(2);
                    if (roll==1) {
                        precip="the sky is overcast.";
                    } else {
                        precip="the sky is clear.";
                    }
                }
                var forecast=temp+wind+precip;
                state.MWCalendar.now.weather=forecast;
            } else {
                state.MWCalendar.now.weather=type;
            }
        }
    },

    moon = function(type) {
        if (state.MWCalendar.now.prevType=="custom") {
            var ordinal=state.MWCalendar.now.ordinal;
            var moon;
            if (state.MWCalendar.now.world==1) {
                let num;
                switch (type) {
                    case 'Full Moon':
                        num=1;
                        break;
                    case 'Waning Gibbous':
                        num=2;
                        break;
                    case 'Last Quarter':
                        num=5;
                        break;
                    case 'Waning Crescent':
                        num=6;
                        break;
                    case 'New Moon':
                        num=9;
                        break;
                    case 'Waxing Crescent':
                        num=11;
                        break;
                    case 'First Quarter':
                        num=13;
                        break;
                    case 'Waxing Gibbous':
                        num=14;
                        break;
                }
                moon = '<img src="'+getMoon(num)+'" style="width:30px;height:30px;"></td></tr>';
                state.MWCalendar.now.moonImg=moon;
            }
        } else if (state.MWCalendar.now.prevType=="random") {
            if (state.MWCalendar.now.world==1) {
                type=randomInteger(8);
                switch (type) {
                    case 1:
                        moon = '<img src="'+getMoon(1)+'" style="width:30px;height:30px;"></td></tr>';
                        break;
                    case 2:
                        moon = '<img src="'+getMoon(2)+'" style="width:30px;height:30px;"></td></tr>';
                        break;
                    case 3:
                        moon = '<img src="'+getMoon(5)+'" style="width:30px;height:30px;"></td></tr>';
                        break;
                    case 4:
                        moon = '<img src="'+getMoon(6)+'" style="width:30px;height:30px;"></td></tr>';
                        break;
                    case 5:
                        moon = '<img src="'+getMoon(9)+'" style="width:30px;height:30px;"></td></tr>';
                        break;
                    case 6:
                        moon = '<img src="'+getMoon(10)+'" style="width:30px;height:30px;"></td></tr>';
                        break;
                    case 7:
                        moon = '<img src="'+getMoon(13)+'" style="width:30px;height:30px;"></td></tr>';
                        break;
                    case 8:
                        moon = '<img src="'+getMoon(14)+'" style="width:30px;height:30px;"></td></tr>';
                        break;
                }
                state.MWCalendar.now.moonImg=moon;
            } else if (state.MWCalendar.now.world==2) {
                //Eberron Moon
            }
        } else if (state.MWCalendar.now.prevType=="normal") {
            if (state.MWCalendar.now.world==1) {
                var year=state.MWCalendar.now.year;
                var ordinal=state.MWCalendar.now.ordinal;
                var remainder=year/4-Math.floor(year/4);
                var moonArray;
                if (remainder==0.25) {
                    moonArray=getFaerunArray("array2");
                } else if (remainder==0.5) {
                    moonArray=getFaerunArray("array3");
                } else if (remainder==0.75) {
                    moonArray=getFaerunArray("array4");
                } else if (remainder==0) {
                    moonArray=getFaerunArray("array1");
                }
                var moonNO = moonArray.split(",");
                var moonImg = moonNO[ordinal];
                moon = '<img src="'+getMoon(moonImg)+'" style="width:30px;height:30px;"></td></tr>';
                return moon;
            } else if (state.MWCalendar.now.world==2) {
                var lunaArray = '0,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7,7,8,8,9,10,10,11,12,12,13,13,14,14,15,15,16,16,1,2,2,3,4,4,5,5,6,6,7';
                var celeneArray = '0,16,16,16,1,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4,4,4,5,6,6,6,6,6,6,6,7,7,7,7,7,7,7,8,8,8,8,8,8,8,9,9,10,10,10,10,10,10,10,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,13,14,14,14,14,14,14,14,15,15,15,15,15,15,15,16,16,16,16,16,16,16,16,1,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4,4,4,5,6,6,6,6,6,6,6,7,7,7,7,7,7,7,8,8,8,8,8,8,8,9,9,10,10,10,10,10,10,10,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,13,14,14,14,14,14,14,14,15,15,15,15,15,15,15,16,16,16,16,16,16,16,16,1,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4,4,4,5,6,6,6,6,6,6,6,7,7,7,7,7,7,7,8,8,8,8,8,8,8,9,9,10,10,10,10,10,10,10,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,13,14,14,14,14,14,14,14,15,15,15,15,15,15,15,16,16,16,16,16,16,16,16,1,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4,4,4,5,6,6,6,6,6,6,6,7,7,7,7,7,7,7,8,8,8,8,8,8,8,9,9,10,10,10,10,10,10,10,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,13,14,14,14,14,14,14,14,15,15,15,15,15,15,15,16,16,16,16,16';
                
                var lunaNO = lunaArray.split(",");
                var lunaImg = lunaNO[ordinal];
                var Luna = getMoon(lunaImg);
                
                var celeneNO = celeneArray.split(",");
                var celeneImg = celeneNO[ordinal];
                var Celene = getMoon(celeneImg);
                
                var moon = '<img src="'+Luna+'" style="width:40px;height:40px;"><img src="'+Celene+'" style="width:30px;height:30px;"></td></tr>';
                state.MWCalendar.now.moonImg=moon;
            }
        }
    },

    getFaerunArray = function(array) {
        var moonArray;
        switch(array) {
            case 'array1':
                moonArray = '0,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,4,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1';
                break;
            case 'array2':
                moonArray = '0,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,14,15,15,16,16,16,0,1,2,2,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1';
                break;
            case 'array3':
                moonArray = '0,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,14,15,15,16,16,16,0,1,2,2,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1';
                break;
            case 'array4':
                moonArray = '0,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,3,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,16,16,1,2,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,0,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16,1,2,2,3,3,4,4,5,6,6,7,7,7,8,8,9,10,10,11,11,12,12,13,14,14,14,15,15,16,16,16,1,2,2,3,3,4,4,5,6,6,7,7,8,8,9,10,10,11,11,11,12,12,13,14,14,15,15,15,16,16';
                break;
        }
        return moonArray;
    },

    getMoon = function(moonNo) {
        var args  = moonNo;
        var moon;
        
        switch(args) {
            case '1':
                // moon = 'Full Moon';
                moon = 'https://www.dropbox.com/s/yo8aqiyw8y8zbzh/full%20moon.jpg?dl=1';
                break;
            case '2':
                // moon = 'Waning Gibbous';
                moon = 'https://www.dropbox.com/s/lgffcyw68w1df9l/waning%20gibbous.jpg?dl=1';
                break;
            case '3':
                // moon = 'Waning Gibbous';
                moon = 'https://www.dropbox.com/s/lgffcyw68w1df9l/waning%20gibbous.jpg?dl=1';
                break;
            case '4':
                // moon = 'Waning Gibbous';
                moon = 'https://www.dropbox.com/s/lgffcyw68w1df9l/waning%20gibbous.jpg?dl=1';
                break;
            case '5':
                // moon = 'Last Quarter';
                moon = 'https://www.dropbox.com/s/o509ci5j2goqvqc/last%20quarter.jpg?dl=1';
                break;
            case '6':
                // moon = 'Waning Crescent';
                moon = 'https://www.dropbox.com/s/3fccjvk2v88hqqo/waning%20crescent.jpg?dl=1';
                break;
            case '7':
                // moon = 'Waning Crescent';
                moon = 'https://www.dropbox.com/s/3fccjvk2v88hqqo/waning%20crescent.jpg?dl=1';
                break;
            case '8':
                // moon = 'Waning Crescent';
                moon = 'https://www.dropbox.com/s/3fccjvk2v88hqqo/waning%20crescent.jpg?dl=1';
                break;
            case '9':
                // moon = 'New Moon';
                moon = 'https://www.dropbox.com/s/jpq8tl2m00e8m0j/new%20moon.jpg?dl=1';
                break;
            case '10':
                // moon = 'Waxing Crescent';
                moon = 'https://www.dropbox.com/s/b8p388vrvv3jw2j/waxing%20crescent.jpg?dl=1';
                break;
            case '11':
                // moon = 'Waxing Crescent';
                moon = 'https://www.dropbox.com/s/b8p388vrvv3jw2j/waxing%20crescent.jpg?dl=1';
                break;
            case '12':
                // moon = 'Waxing Crescent';
                moon = 'https://www.dropbox.com/s/b8p388vrvv3jw2j/waxing%20crescent.jpg?dl=1';
                break;
            case '13':
                // moon = 'First Quarter';
                moon = 'https://www.dropbox.com/s/glnn9q9swr5o3wk/first%20quarter.jpg?dl=1';
                break;
            case '14':
                // moon = 'Waxing Gibbous';
                moon = 'https://www.dropbox.com/s/b4li1bckebp4cua/waxing%20gibbous.jpg?dl=1';
                break;
            case '15':
                // moon = 'Waxing Gibbous';
                moon = 'https://www.dropbox.com/s/b4li1bckebp4cua/waxing%20gibbous.jpg?dl=1';
                break;
            case '16':
                // moon = 'Waxing Gibbous';
                moon = 'https://www.dropbox.com/s/b4li1bckebp4cua/waxing%20gibbous.jpg?dl=1';
                break;
        }
        return moon;
    },

    getWorld = function() {
        let worldnum=state.MWCalendar.now.world;
        let world;
        switch (worldnum) {
            case 1:
                world="Faerûn";
            break;
            case 2:
                world="Greyhawk";
            break;
            case 3:
                world="Modern";
            break;
            case 4:
                world="Eberron";
            break;
            case 5:
                world="Tal\'Dorei";
            break;
        }
        return world;
    },

    getMoMenu = function() {
        var world = Number(state.MWCalendar.now.world);
        var moMenu;
        
        switch(world){
            case 1:
                moMenu = '?{Month|Hammer|Alturiak|Ches|Tarsakh|Mirtul|Kythorn|Flamerule|Eleasias|Eleint|Marpenoth|Uktar||Nightal}';
                break;
            case 2:
                moMenu = '?{Month|Fire Seek|Readying|Coldeven|Planting|Flocktime|Wealsun|Reaping|Goodmonth|Harvester|Patchwall|Ready\'reat|Sunsebb}';
                break;
            case 3:
                moMenu = '?{Month|January|February|March|April|May|June|July|August|September|October|November|December}';
                break;
            case 4:
                moMenu = '?{Month|Zarantyr|Olarune|Therendor|Eyre|Dravago|Nymm|Lharvion|Barrakas|Rhaan|Sypheros|Aryth|Vult}';
                break;
            case 5:
                moMenu = '?{Month|Horisal|Misuthar|Dualahei|Thunsheer|Unndilar|Brussendar|Sydenstar|Fessuran|Quen\'pillar|Cuersaar|Duscar}';
        }
        
        return moMenu;
    },
    
    reset = function() {
        var divstyle = 'style="width: 220px; border: 1px solid black; background-color: #ffffff; padding: 5px;"';
        var astyle1 = 'style="text-align:center; border: 1px solid black; margin: 1px; background-color: #7E2D40; border-radius: 4px;  box-shadow: 1px 1px 1px #707070; width: 100px;';
        var astyle2 = 'style="text-align:center; border: 1px solid black; margin: 1px; background-color: #7E2D40; border-radius: 4px;  box-shadow: 1px 1px 1px #707070; width: 150px;';
        var tablestyle = 'style="text-align:center;"';
        var arrowstyle = 'style="border: none; border-top: 3px solid transparent; border-bottom: 3px solid transparent; border-left: 195px solid rgb(126, 45, 64); margin-bottom: 2px; margin-top: 2px;"';
        var headstyle = 'style="color: rgb(126, 45, 64); font-size: 18px; text-align: left; font-variant: small-caps; font-family: Times, serif;"';
        var substyle = 'style="font-size: 11px; line-height: 13px; margin-top: -3px; font-style: italic;"';
        var tdstyle = 'style="padding: 2px; padding-left: 5px; border: none;"';
        sendChat("Multi-World Calendar","/w gm <div " + divstyle + ">" + //--
            '<div ' + headstyle + '>Multi-World Calendar</div>' + //--
            '<div ' + substyle + '>Reset</div>' + //--
            '<div ' + arrowstyle + '></div>' + //--
            'Are you absolutely sure that you want to Reset this Script?<br><br>This will completely reset all settings that you have made and also delete all Alarms.' + //--
            '<br><br>' + //--
            '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --reset --Yes">Confirm</a></div>' + //--
            '<div style="text-align:center;"><a ' + astyle2 + '" href="!mwcal --reset --No">Cancel</a></div>' + //--
            '<div>'
        );
    },

    checkInstall = function(reset) {
        if (Boolean(reset)!==true) {
            if (!state.MWCalendar) {
                setDefaults();
            }
            if (!state.Alarm) {
                setAlarmDefaults();
            }
        } else if (Boolean(reset)==true) {
            if (state.MWCalendar) {
                setDefaults();
            }
            if (state.Alarm) {
                setAlarmDefaults();
            }
        }
    },

    registerEventHandlers = function() {
        on('chat:message', handleInput);
    };

    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };
}());
on("ready", function() {
    'use strict';
    MultiWorldCalendar.CheckInstall();
    MultiWorldCalendar.RegisterEventHandlers();
});
