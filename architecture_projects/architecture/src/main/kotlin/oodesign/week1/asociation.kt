package oodesign.week1

class Food(
    var calories: Int = 0
) {
    fun addWine(wine: Wine) {
        calories += wine.calories
    }
}

class Wine(val calories: Int = 0);

fun main(args: Array<String>) {
    val food = Food()
    val wine = Wine(100)
    food.addWine(wine)
    println("total food calories: ${food.calories}")
}
