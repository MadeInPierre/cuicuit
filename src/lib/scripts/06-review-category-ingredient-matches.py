import csv
import os
from rich.console import Console
from rich.table import Table

INPUT_CSV = "data/matched_ingredients.csv"
OUTPUT_CSV = "data/matched_ingredients_reviewed.csv"

console = Console()


def load_reviewed():
    """Load already reviewed matches to avoid duplicate work."""
    if not os.path.exists(OUTPUT_CSV):
        return {}
    with open(OUTPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        return {rows[0]: rows[1] for rows in reader}  # Dictionary of ingredient -> category


def save_reviewed(ingredient, category):
    """Save a reviewed match to the output CSV file."""
    with open(OUTPUT_CSV, "a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([ingredient, category])


def review_matches():
    reviewed = load_reviewed()

    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f)

        for row in reader:
            ingredient = row[0]
            if ingredient in reviewed:
                continue  # Skip already reviewed rows

            # Display options
            table = Table(title=f"Review Matches for: [bold cyan]{ingredient}[/bold cyan]")
            table.add_column("Option", style="bold")
            table.add_column("Category", style="yellow")
            table.add_column("Score", style="green")

            for i in range(1, 6):
                table.add_row(str(i), row[2 * i - 1], row[2 * i])

            console.print(table)

            # User input
            choice = None
            while choice not in {"", "1", "2", "3", "4", "5"}:
                choice = console.input("Select best match (1/2/3/4/5) or type 's' to skip (1): ")
                if choice == "":
                    choice = "1"
                if choice == "s":
                    break

            if choice in {"1", "2", "3", "4", "5"}:
                best_category = row[int(choice) * 2 - 1]
                save_reviewed(ingredient, best_category)
                console.print(f"[bold green]Saved:[/bold green] {ingredient} -> {best_category}\n")


if __name__ == "__main__":
    review_matches()
