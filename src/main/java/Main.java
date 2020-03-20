import io.javalin.Javalin;

public class Main {
    public static void main(String[] args) {
        Javalin app = Javalin.create(config -> {
            config.addStaticFiles("images/");
            config.addStaticFiles("js/");
        });

        app.get("/", (ctx) -> {
            ctx.status(200);
            ctx.render("html/index.html");
        });
        app.start(7000);
    }
}
