import java.util.Random;
import javax.microedition.lcdui.*;
import javax.microedition.midlet.MIDlet;

public class NumberGuess extends MIDlet
    implements CommandListener
{

    public void commandAction(Command command, Displayable displayable)
    {
        if(command == Ok)
            _Ok_action();
        if(command == Exit)
            _Exit_action();
        if(command == ic)
            _ic_action();
        if(command == icb)
            _display.setCurrent(form);
    }

    public void startApp()
    {
        st();
        b.setString("I create a four different number, and you guess.");
        form.append(a);
        form.append(b);
        form.addCommand(Ok);
        form.addCommand(Exit);
        form.addCommand(ic);
        form.setCommandListener(this);
        _display.setCurrent(form);
    }

    public void destroyApp(boolean flag)
    {
        _display = null;
        form = null;
        Ok = null;
        Exit = null;
        System.gc();
        notifyDestroyed();
    }

    public void pauseApp()
    {
        System.gc();
    }

    public void _Ok_action()
    {
        if(count3 == 0)
            msg = null;
        int i = Main(a.getString());
        count3 = count3 + i;
        if(count3 == 8 && count2 != 4)
        {
            result = "I'm very sorry!\nYou are wrong.\nThe right answer is ";
            if(csz1[0] == 0)
                result = String.valueOf(result).concat("0");
            result = result + Integer.toString(csz1[0] * 1000 + csz1[1] * 100 + csz1[2] * 10 + csz1[3]);
        }
        if(count2 != 4 && count3 < 8)
        {
            b.setString("No. " + String.valueOf(Integer.toString(count3)) + " " + String.valueOf(result));
        } else
        {
            b.setString(result);
            st();
        }
        if(i == 1)
            if(msg != null)
            {
                if(count3 != 0)
                    msg = msg + String.valueOf(Integer.toString(count3)) + " " + String.valueOf(result) + "\n";
                else
                    msg = (msg + result).concat("\n");
            } else
            {
                msg = Integer.toString(count3) + " " + String.valueOf(result) + "\n";
            }
        a.setString(null);
    }

    public void _Exit_action()
    {
        destroyApp(true);
    }

    public int[] rnd()
    {
        int ai[] = new int[4];
        boolean flag = false;
        while("s" == "s")
        {
            boolean flag1 = false;
            ai[0] = Math.abs(RNG.nextInt() % 10);
            ai[1] = Math.abs(RNG.nextInt() % 10);
            ai[2] = Math.abs(RNG.nextInt() % 10);
            ai[3] = Math.abs(RNG.nextInt() % 10);
            for(int i = 0; i <= 3; i++)
            {
                for(int j = i + 1; j <= 3; j++)
                    if(ai[i] == ai[j])
                        flag1 = true;

            }

            if(!flag1)
                break;
        }
        return ai;
    }

    public void st()
    {
        csz1 = rnd();
        count3 = 0;
    }

    public int[] str2int(String s)
    {
        int ai[] = new int[4];
        int i = Integer.parseInt(s);
        ai[0] = i / 1000;
        i -= ai[0] * 1000;
        ai[1] = i / 100;
        i -= ai[1] * 100;
        ai[2] = i / 10;
        i -= ai[2] * 10;
        ai[3] = i;
        return ai;
    }

    public int Main(String s)
    {
        result = "Error!";
        if(s.length() != 4)
            return 0;
        boolean flag = false;
        count1 = 0;
        count2 = 0;
        csz2 = str2int(s);
        for(int i = 0; i <= 3; i++)
        {
            for(int k = i + 1; k <= 3; k++)
                if(csz2[i] == csz2[k])
                    return 0;

        }

        for(int j = 0; j <= 3; j++)
        {
            for(int l = 0; l <= 3; l++)
                if(csz1[l] == csz2[j])
                    count1++;

            if(csz1[j] == csz2[j])
            {
                count2++;
                count1--;
            }
        }

        if(count2 == 4)
            result = "You are rigit!\nThe Number is ".concat(String.valueOf(s));
        else
            result = s + "  " + String.valueOf(Integer.toString(count2)) + "A" + String.valueOf(Integer.toString(count1)) + "B";
        return 1;
    }

    public void _ic_action()
    {
        info = new Form("Result");
        if(msg != null)
            info.append(msg);
        info.addCommand(icb);
        info.setCommandListener(this);
        _display.setCurrent(info);
    }

    public NumberGuess()
    {
        RNG = new Random();
        csz1 = new int[4];
        csz2 = new int[4];
        a = new TextField("Input", null, 4, 2);
        b = new TextField("Result", null, 120, 0);
        _display = Display.getDisplay(this);
        form = new Form("NumberGuess");
        Ok = new Command("Ok", "Ok", 4, 0);
        Exit = new Command("Exit", "Exit", 7, 0);
        icb = new Command("Back", 1, 1);
        ic = new Command("Info", "Info", 8, 0);
    }

    Random RNG;
    public int csz1[];
    public int csz2[];
    public int count1;
    public int count2;
    public String result;
    public int count3;
    public Form info;
    public String msg;
    TextField a;
    TextField b;
    Display _display;
    Form form;
    Command Ok;
    Command Exit;
    Command icb;
    Command ic;
}
