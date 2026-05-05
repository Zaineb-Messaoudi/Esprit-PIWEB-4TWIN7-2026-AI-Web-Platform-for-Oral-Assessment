from datasets import load_dataset

ds = load_dataset('Alex123321/english_cefr_dataset')
ds['train'].to_csv('data/cefr_words.csv', index=False)
print('Done')