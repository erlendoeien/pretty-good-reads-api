import os
from pathlib import Path
import pandas as pd


path = os.path.join(Path(__file__).parent, Path('../../data'))

goodreads = pd.read_csv(os.path.join(path, 'goodreads.csv'))
goodreads_relevant = goodreads[["title",
                "authors",
                "isbn",
                "isbn13",
                "language_code",
                "num_pages",
                "publication_date",
                "publisher",
                "ratings_count"]]

goodreads_relevant.reset_index()
#book32 = pd.read_csv(os.path.join(path, 'book32_cleaned.csv'))
# left_joined = pd.merge(goodreads_relevant, book32, on='title', how='left')
goodreads_relevant.to_csv(os.path.join(path, 'goodreads_cleaned.csv'))
goodreads_relevant.to_json(os.path.join(path, 'goodreads_cleaned.json'), orient="records", indent=2)
# book32.to_json(os.path.join(path, 'book32_cleaned.json'), orient="records", indent=2)

