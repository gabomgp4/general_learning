package oodesign.week1;

import java.util.ArrayList;

class Chapter {
    private String name;

    public Chapter(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}

class Book {
    ArrayList<Chapter> chapters = new ArrayList<>();

    public void addChapter(String name){
        chapters.add(new Chapter(name));
    }
}
