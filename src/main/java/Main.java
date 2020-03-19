import io.javalin.Javalin;

public class Main {
    /*
    Visit https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages for more documentation:
    Both HTTP requests and responses use the following format:
    ---------------------------------------------------------------
    | one line about the response or request                       |
    | arbitrary amount of headers (like Content-type: text/html)   |
    |                                                              |
    | body                                                         |
    ---------------------------------------------------------------

    REQUESTS
    --------
    In requests, the first line is usually the following: method path HTTPVersion
    Method is either GET, POST, DELETE, or PUT. Further, the body is usually empty for GET but not POST.
    Some common HEADERS are "Host: val" and "User-Agent: val".
    NOTE, forms, by default, store input info. in the path of a GET request. If the form uses a POST request,
    then the input info. is stored in the body.

    RESPONSES
    ---------
    In responses, the first line is usually HTTPVersion status EnglishStatus.
    a common header is "Content-Length: val", "Content-type: val", and "Last-Modified: val".
    For GET responses, the body is usually the HTML to send. For POST responses, the body can be anything.
     */
    public static void main(String[] args) {
        Javalin app = Javalin.create(config -> {
            config.addStaticFiles("");
        });

        app.get("/", (ctx) -> {
            ctx.status(200);
            ctx.render("index.html");
        });
        app.start(7000);
    }
}
