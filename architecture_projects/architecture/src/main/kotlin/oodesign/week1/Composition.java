package oodesign.week1;

class Employee implements AutoCloseable {
    private final Salary salary;
    private final String name;

    public Employee(String name, double ammount) {
        this.name = name;
        this.salary = new Salary(ammount);
    }

    @Override
    public void close() throws Exception {
        salary.close();
    }
}

class Salary implements AutoCloseable {
    private final double ammount;

    public Salary(double ammount)  {
        this.ammount = ammount;
    }

    public double getAmmount() {
        return ammount;
    }

    @Override
    public void close() throws Exception {
        System.console().printf("clossed");
    }
}
