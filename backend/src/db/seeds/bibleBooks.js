const { db } = require('../database');

const BIBLE_BOOKS_DATA = [
  // --- OLD TESTAMENT: THE PENTATEUCH / LAW (TORAH) ---
  {
    order: 1, name: 'Genesis', testament: 'OLD', category: 'Law', total_chapters: 50,
    author: 'Moses (traditional)', date: 'c. 1446–1406 BC',
    theme: 'Beginnings: Creation, Fall, Covenant, and the Patriarchal Promise',
    key_ref: 'Genesis 1:1', key_text: 'In the beginning, God created the heavens and the earth.',
    background: 'Sets the stage for the entire biblical meta-narrative, from creation and humanity’s rebellion in Eden to God’s covenant with Abraham, Isaac, Jacob, and Joseph in Egypt.'
  },
  {
    order: 2, name: 'Exodus', testament: 'OLD', category: 'Law', total_chapters: 40,
    author: 'Moses', date: 'c. 1446–1406 BC',
    theme: 'Deliverance, Redemption, and God’s Covenant at Mount Sinai',
    key_ref: 'Exodus 3:14', key_text: 'God said to Moses, "I AM WHO I AM." He said, "You shall tell the children of Israel this: ‘I AM has sent me to you.’"',
    background: 'Documents Israel’s enslavement in Egypt, Moses’ calling, the 10 Plagues, the Red Sea crossing, giving of the Ten Commandments, and the construction of the Tabernacle.'
  },
  {
    order: 3, name: 'Leviticus', testament: 'OLD', category: 'Law', total_chapters: 27,
    author: 'Moses', date: 'c. 1446–1406 BC',
    theme: 'The Holiness of God and the System of Atonement',
    key_ref: 'Leviticus 19:2', key_text: 'Speak to all the congregation of the children of Israel, and tell them, "You shall be holy; for I Yahweh your God am holy."',
    background: 'Provides the sacrificial system, priesthood regulations, laws of ritual purity, and the Day of Atonement (Yom Kippur) that foreshadows Christ.'
  },
  {
    order: 4, name: 'Numbers', testament: 'OLD', category: 'Law', total_chapters: 36,
    author: 'Moses', date: 'c. 1446–1406 BC',
    theme: 'Wilderness Wanderings, Human Faithlessness, and Divine Faithfulness',
    key_ref: 'Numbers 6:24-26', key_text: 'Yahweh bless you, and keep you. Yahweh make his face to shine on you, and be gracious to you. Yahweh lift up his face toward you, and give you peace.',
    background: 'Traces the 40-year wilderness trek from Sinai to the plains of Moab due to unbelief at Kadesh-barnea.'
  },
  {
    order: 5, name: 'Deuteronomy', testament: 'OLD', category: 'Law', total_chapters: 34,
    author: 'Moses', date: 'c. 1406 BC',
    theme: 'Covenant Renewal and the Call to Wholehearted Love for God',
    key_ref: 'Deuteronomy 6:4-5', key_text: 'Hear, Israel: Yahweh is our God. Yahweh is one. You shall love Yahweh your God with all your heart, with all your soul, and with all your might.',
    background: 'Moses’ farewell discourses to the new generation of Israelites on the verge of crossing the Jordan River into the Promised Land.'
  },

  // --- HISTORICAL BOOKS ---
  {
    order: 6, name: 'Joshua', testament: 'OLD', category: 'Historical', total_chapters: 24,
    author: 'Joshua / Phinehas', date: 'c. 1400–1370 BC',
    theme: 'Conquest of Canaan and Faithfulness to the Covenant',
    key_ref: 'Joshua 24:15', key_text: 'As for me and my house, we will serve Yahweh.',
    background: 'The miraculous crossing of the Jordan, fall of Jericho, territorial allotment to the 12 tribes, and Joshua’s final covenant challenge.'
  },
  {
    order: 7, name: 'Judges', testament: 'OLD', category: 'Historical', total_chapters: 21,
    author: 'Samuel (traditional)', date: 'c. 1050–1000 BC',
    theme: 'The Cycles of Apostasy, Oppression, Repentance, and Deliverance',
    key_ref: 'Judges 21:25', key_text: 'In those days there was no king in Israel. Everyone did that which was right in his own eyes.',
    background: 'Covers the tumultuous dark age between Joshua and the monarchy, highlighting heroes like Deborah, Gideon, and Samson.'
  },
  {
    order: 8, name: 'Ruth', testament: 'OLD', category: 'Historical', total_chapters: 4,
    author: 'Samuel (traditional)', date: 'c. 1000 BC',
    theme: 'Lovingkindness (Hesed) and the Kinsman-Redeemer',
    key_ref: 'Ruth 1:16', key_text: 'Your people will be my people, and your God my God.',
    background: 'A Moabite widow chooses loyalty to the God of Israel and marries Boaz, becoming the great-grandmother of King David.'
  },
  {
    order: 9, name: '1 Samuel', testament: 'OLD', category: 'Historical', total_chapters: 31,
    author: 'Samuel, Nathan, Gad', date: 'c. 930 BC',
    theme: 'Transition from Judges to Kingship: Saul and the Anointing of David',
    key_ref: '1 Samuel 16:7', key_text: 'Yahweh doesn’t see as man sees; for man looks at the outward appearance, but Yahweh looks at the heart.',
    background: 'Traces the prophet Samuel, King Saul’s rise and tragic fall, and David’s victory over Goliath and fugitive years.'
  },
  {
    order: 10, name: '2 Samuel', testament: 'OLD', category: 'Historical', total_chapters: 24,
    author: 'Nathan, Gad', date: 'c. 930 BC',
    theme: 'The Reign of David and the Eternal Davidic Covenant',
    key_ref: '2 Samuel 7:16', key_text: 'Your house and your kingdom will be made sure forever before you. Your throne will be established forever.',
    background: 'David’s golden reign over a united kingdom, the conquest of Jerusalem, his grievous sin with Bathsheba, and family turmoil.'
  },
  {
    order: 11, name: '1 Kings', testament: 'OLD', category: 'Historical', total_chapters: 22,
    author: 'Jeremiah (traditional)', date: 'c. 560–540 BC',
    theme: 'Solomon’s Wisdom, Temple Construction, and the Divided Kingdom',
    key_ref: '1 Kings 18:39', key_text: 'When all the people saw it, they fell on their faces. They said, "Yahweh, he is God! Yahweh, he is God!"',
    background: 'Solomon’s peak glory and apostasy, the schism into Northern Israel and Southern Judah, and Elijah’s confrontation with Baal at Mount Carmel.'
  },
  {
    order: 12, name: '2 Kings', testament: 'OLD', category: 'Historical', total_chapters: 25,
    author: 'Jeremiah (traditional)', date: 'c. 560–540 BC',
    theme: 'The Fall of the Kingdoms: Assyrian and Babylonian Exiles',
    key_ref: '2 Kings 17:13', key_text: 'Yet Yahweh testified to Israel and to Judah, by every prophet and every seer, saying, "Turn from your evil ways."',
    background: 'Elisha’s ministry, the destruction of Samaria by Assyria (722 BC), Josiah’s reforms, and the fall of Jerusalem to Babylon (586 BC).'
  },
  {
    order: 13, name: '1 Chronicles', testament: 'OLD', category: 'Historical', total_chapters: 29,
    author: 'Ezra (traditional)', date: 'c. 450–430 BC',
    theme: 'Priestly Perspective on David’s Reign and Temple Worship',
    key_ref: '1 Chronicles 16:34', key_text: 'Oh give thanks to Yahweh, for he is good, for his loving kindness endures forever.',
    background: 'Written to post-exilic returnees to reaffirm their royal and priestly heritage, focusing on David’s temple preparations.'
  },
  {
    order: 14, name: '2 Chronicles', testament: 'OLD', category: 'Historical', total_chapters: 36,
    author: 'Ezra (traditional)', date: 'c. 450–430 BC',
    theme: 'Judah’s Kings, Temple Centrality, and Spiritual Revival',
    key_ref: '2 Chronicles 7:14', key_text: 'If my people, who are called by my name, will humble themselves, pray, seek my face, and turn from their wicked ways; then I will hear from heaven, will forgive their sin, and will heal their land.',
    background: 'Traces Solomon’s temple dedication and the spiritual revivals of kings like Hezekiah and Josiah until the decree of Cyrus of Persia.'
  },
  {
    order: 15, name: 'Ezra', testament: 'OLD', category: 'Historical', total_chapters: 10,
    author: 'Ezra', date: 'c. 450 BC',
    theme: 'Return from Babylon, Rebuilding the Temple, and Spiritual Restoration',
    key_ref: 'Ezra 7:10', key_text: 'For Ezra had set his heart to seek Yahweh’s law, and to do it, and to teach in Israel statutes and ordinances.',
    background: 'Zerubbabel’s return, the rebuilding of the Second Temple against opposition, and Ezra’s return to restore biblical purity.'
  },
  {
    order: 16, name: 'Nehemiah', testament: 'OLD', category: 'Historical', total_chapters: 13,
    author: 'Nehemiah', date: 'c. 430 BC',
    theme: 'Rebuilding Jerusalem’s Walls and Covenant Community Reform',
    key_ref: 'Nehemiah 8:10', key_text: 'Don’t be grieved; for the joy of Yahweh is your strength.',
    background: 'The Persian king’s cupbearer returns to rebuild Jerusalem’s rubble walls in 52 days amidst fierce regional threats.'
  },
  {
    order: 17, name: 'Esther', testament: 'OLD', category: 'Historical', total_chapters: 10,
    author: 'Mordecai (traditional)', date: 'c. 470–450 BC',
    theme: 'God’s Providential Preservation of His People in Persia',
    key_ref: 'Esther 4:14', key_text: 'Who knows if you haven’t come to the kingdom for such a time as this?',
    background: 'Set in Susa during Xerxes I; an orphaned Jewish girl becomes Queen and risks her life to foil Haman’s genocidal plot.'
  },

  // --- POETRY AND WISDOM ---
  {
    order: 18, name: 'Job', testament: 'OLD', category: 'Poetry', total_chapters: 42,
    author: 'Unknown (ancient patriarchal era)', date: 'c. Patriarchal era / edited c. 900 BC',
    theme: 'The Mystery of Suffering and the Supreme Sovereignty of God',
    key_ref: 'Job 19:25', key_text: 'But as for me, I know that my Redeemer lives. In the end, he will stand upon the earth.',
    background: 'An intensely rich poetic dialogue in Uz exploring why righteous people suffer, culminating in God speaking from the whirlwind.'
  },
  {
    order: 19, name: 'Psalms', testament: 'OLD', category: 'Poetry', total_chapters: 150,
    author: 'David, Asaph, Sons of Korah, Moses, Solomon', date: 'c. 1400–450 BC',
    theme: 'Praise, Lament, Messianic Prophecy, and Honest Prayer',
    key_ref: 'Psalm 23:1', key_text: 'Yahweh is my shepherd: I shall lack nothing.',
    background: 'The ancient hymnal and prayer book of Israel, spanning songs of personal crisis, corporate worship, royal triumphs, and penitence.'
  },
  {
    order: 20, name: 'Proverbs', testament: 'OLD', category: 'Poetry', total_chapters: 31,
    author: 'Solomon, Agur, Lemuel', date: 'c. 950–700 BC',
    theme: 'The Fear of the Lord as the Foundation of Practical Wisdom',
    key_ref: 'Proverbs 3:5-6', key_text: 'Trust in Yahweh with all your heart, and don’t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.',
    background: 'A manual for everyday righteous living, addressing speech, work, relationships, justice, and family.'
  },
  {
    order: 21, name: 'Ecclesiastes', testament: 'OLD', category: 'Poetry', total_chapters: 12,
    author: 'Solomon (traditional)', date: 'c. 935 BC',
    theme: 'The Meaning of Life Under the Sun and the Ultimate Duty of Man',
    key_ref: 'Ecclesiastes 12:13', key_text: 'Fear God, and keep his commandments; for this is the whole duty of man.',
    background: 'A philosophical inquest into earthly pleasures, wealth, and intellect, revealing life without God is vanity (hebel).'
  },
  {
    order: 22, name: 'Song of Solomon', testament: 'OLD', category: 'Poetry', total_chapters: 8,
    author: 'Solomon', date: 'c. 950 BC',
    theme: 'The Beauty, Purity, and Delight of Marital Love',
    key_ref: 'Song of Solomon 8:6', key_text: 'For love is as strong as death. Jealousy is as cruel as Sheol. Its flashes are flashes of fire, a very flame of Yahweh.',
    background: 'Poetic celebrations of courtship, covenant marriage, and emotional and physical intimacy, mirroring God’s love for His covenant people.'
  },

  // --- MAJOR PROPHETS ---
  {
    order: 23, name: 'Isaiah', testament: 'OLD', category: 'Major Prophets', total_chapters: 66,
    author: 'Isaiah', date: 'c. 740–680 BC',
    theme: 'Judgment, Redemption, and the Suffering Servant of Yahweh',
    key_ref: 'Isaiah 53:5', key_text: 'He was pierced for our transgressions. He was crushed for our iniquities. The punishment that brought our peace was on him; and by his wounds we are healed.',
    background: 'Often called "The Fifth Gospel" due to vivid prophecies of Christ’s virgin birth (ch. 7), titles (ch. 9), passion (ch. 53), and the New Creation.'
  },
  {
    order: 24, name: 'Jeremiah', testament: 'OLD', category: 'Major Prophets', total_chapters: 52,
    author: 'Jeremiah', date: 'c. 627–580 BC',
    theme: 'The Weeping Prophet, Inevitable Judgment, and the New Covenant',
    key_ref: 'Jeremiah 31:33', key_text: 'I will put my law in their inward parts, and in their heart will I write it. I will be their God, and they will be my people.',
    background: 'Jeremiah warned Jerusalem for 40 years before its destruction by Nebuchadnezzar, enduring imprisonment and ridicule.'
  },
  {
    order: 25, name: 'Lamentations', testament: 'OLD', category: 'Major Prophets', total_chapters: 5,
    author: 'Jeremiah', date: 'c. 586 BC',
    theme: 'Mourning the Ruin of Jerusalem and Confidence in God’s Mercies',
    key_ref: 'Lamentations 3:22-23', key_text: 'It is because of Yahweh’s loving kindnesses that we are not consumed, because his compassion doesn’t fail. They are new every morning. Great is your faithfulness.',
    background: 'Five acrostic dirges written amidst the smoking ashes of Solomon’s destroyed temple.'
  },
  {
    order: 26, name: 'Ezekiel', testament: 'OLD', category: 'Major Prophets', total_chapters: 48,
    author: 'Ezekiel', date: 'c. 593–571 BC',
    theme: 'The Glory of God, Individual Responsibility, and the Valley of Dry Bones',
    key_ref: 'Ezekiel 36:26', key_text: 'I will also give you a new heart, and I will put a new spirit within you. I will take away the stony heart out of your flesh, and I will give you a heart of flesh.',
    background: 'Priestly prophet in Babylon by the River Chebar, dramatizing warnings and foreseeing the departure and return of God’s glory.'
  },
  {
    order: 27, name: 'Daniel', testament: 'OLD', category: 'Major Prophets', total_chapters: 12,
    author: 'Daniel', date: 'c. 605–535 BC',
    theme: 'God’s Absolute Rule Over World Empires and the Eternal Kingdom',
    key_ref: 'Daniel 2:44', key_text: 'The God of heaven will set up a kingdom which will never be destroyed.',
    background: 'Royal court intrigue in Babylon and Persia (fiery furnace, lions’ den) intertwined with apocalyptic visions of global empires.'
  },

  // --- MINOR PROPHETS ---
  {
    order: 28, name: 'Hosea', testament: 'OLD', category: 'Minor Prophets', total_chapters: 14,
    author: 'Hosea', date: 'c. 750–715 BC',
    theme: 'God’s Relentless, Redeeming Love for an Unfaithful Bride',
    key_ref: 'Hosea 6:6', key_text: 'For I desire mercy, and not sacrifice; and the knowledge of God more than burnt offerings.',
    background: 'Hosea commanded to marry an unfaithful woman (Gomer) as a living parable of God’s heartbreak and restoration of Israel.'
  },
  {
    order: 29, name: 'Joel', testament: 'OLD', category: 'Minor Prophets', total_chapters: 3,
    author: 'Joel', date: 'c. 835 BC (or post-exilic)',
    theme: 'The Day of the Lord and the Outpouring of the Holy Spirit',
    key_ref: 'Joel 2:28', key_text: 'It will happen afterward, that I will pour out my Spirit on all flesh; and your sons and your daughters will prophesy.',
    background: 'A devastating locust plague serves as a harbinger of the cosmic Day of the Lord, fulfilled at Pentecost (Acts 2).'
  },
  {
    order: 30, name: 'Amos', testament: 'OLD', category: 'Minor Prophets', total_chapters: 9,
    author: 'Amos', date: 'c. 760–750 BC',
    theme: 'Divine Justice, Social Righteousness, and the Plumb Line',
    key_ref: 'Amos 5:24', key_text: 'Let justice roll on like waters, and righteousness like a mighty stream.',
    background: 'A shepherd and fig-grower from Tekoa rebukes the wealthy, corrupt elite of the Northern Kingdom.'
  },
  {
    order: 31, name: 'Obadiah', testament: 'OLD', category: 'Minor Prophets', total_chapters: 1,
    author: 'Obadiah', date: 'c. 586 BC',
    theme: 'The Doom of Edom for Its Pride and Treachery Against Israel',
    key_ref: 'Obadiah 1:21', key_text: 'Saviors will go up on Mount Zion to judge the mountains of Esau, and the kingdom will be Yahweh’s.',
    background: 'The shortest OT book; pronounces doom on the descendants of Esau for gloating over Jerusalem’s fall.'
  },
  {
    order: 32, name: 'Jonah', testament: 'OLD', category: 'Minor Prophets', total_chapters: 4,
    author: 'Jonah', date: 'c. 780–760 BC',
    theme: 'God’s Boundless Mercy Extending to Gentle and Hostile Nations',
    key_ref: 'Jonah 4:2', key_text: 'I knew that you are a gracious God, and merciful, slow to anger, and abundant in loving kindness.',
    background: 'A rebellious prophet runs from Nineveh, gets swallowed by a great fish, and witnesses one of history’s greatest citywide revivals.'
  },
  {
    order: 33, name: 'Micah', testament: 'OLD', category: 'Minor Prophets', total_chapters: 7,
    author: 'Micah', date: 'c. 735–700 BC',
    theme: 'True Religion: Justice, Mercy, Humility, and the Ruler Born in Bethlehem',
    key_ref: 'Micah 6:8', key_text: 'He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?',
    background: 'Prophesies the exact birthplace of the Messiah in Bethlehem Ephrathah (5:2) and defends the poor against corrupt judges.'
  },
  {
    order: 34, name: 'Nahum', testament: 'OLD', category: 'Minor Prophets', total_chapters: 3,
    author: 'Nahum', date: 'c. 663–612 BC',
    theme: 'The Retribution and Ultimate Collapse of Brutal Nineveh',
    key_ref: 'Nahum 1:7', key_text: 'Yahweh is good, a stronghold in the day of trouble; and he knows those who take refuge in him.',
    background: 'A sequel to Jonah 150 years later: Nineveh relapsed into brutal cruelty and faced total obliteration by the Babylonians.'
  },
  {
    order: 35, name: 'Habakkuk', testament: 'OLD', category: 'Minor Prophets', total_chapters: 3,
    author: 'Habakkuk', date: 'c. 608–605 BC',
    theme: 'From Questioning to Worship: "The Just Shall Live by His Faith"',
    key_ref: 'Habakkuk 2:4', key_text: 'The righteous will live by his faith.',
    background: 'A dialogue where the prophet wrestles with why God would use wicked Babylon to judge Judah, concluding in a song of triumphant faith.'
  },
  {
    order: 36, name: 'Zephaniah', testament: 'OLD', category: 'Minor Prophets', total_chapters: 3,
    author: 'Zephaniah', date: 'c. 630 BC',
    theme: 'The Purging Fire of Judgment and God Rejoicing Over His People',
    key_ref: 'Zephaniah 3:17', key_text: 'Yahweh your God is among you, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love. He will rejoice over you with singing.',
    background: 'King Josiah’s contemporary warning of global and Judean judgment, followed by songs of restoration.'
  },
  {
    order: 37, name: 'Haggai', testament: 'OLD', category: 'Minor Prophets', total_chapters: 2,
    author: 'Haggai', date: 'c. 520 BC',
    theme: 'Reordering Priorities: "Rebuild the House of the Lord"',
    key_ref: 'Haggai 1:8', key_text: 'Go up to the mountain, bring wood, and build the house. I will take pleasure in it, and I will be glorified, says Yahweh.',
    background: 'Four stern messages challenging returned exiles who panelled their own houses while God’s temple lay in ruins.'
  },
  {
    order: 38, name: 'Zechariah', testament: 'OLD', category: 'Minor Prophets', total_chapters: 14,
    author: 'Zechariah', date: 'c. 520–480 BC',
    theme: 'Messianic Visions: The King on a Donkey, Thirty Pieces of Silver, Pierced Savior',
    key_ref: 'Zechariah 9:9', key_text: 'Rejoice greatly, daughter of Zion! Shout, daughter of Jerusalem! Behold, your King comes to you! He is righteous, and having salvation; lowly, and riding on a donkey.',
    background: 'Apocalyptic visions encouraging the temple rebuilding, packed with specific prophecies of Jesus’ first and second comings.'
  },
  {
    order: 39, name: 'Malachi', testament: 'OLD', category: 'Minor Prophets', total_chapters: 4,
    author: 'Malachi', date: 'c. 430 BC',
    theme: 'God’s Unchanging Love, Warning Against Spiritual Apathy, and the Sun of Righteousness',
    key_ref: 'Malachi 4:2', key_text: 'But to you who fear my name shall the sun of righteousness arise with healing in its wings.',
    background: 'The final voice of the Old Testament before 400 silent years, predicting the coming of Elijah (John the Baptist).'
  },

  // --- NEW TESTAMENT: GOSPELS & ACTS ---
  {
    order: 40, name: 'Matthew', testament: 'NEW', category: 'Gospels', total_chapters: 28,
    author: 'Matthew (Levi)', date: 'c. AD 55–65',
    theme: 'Jesus as the Promised Messiah, King of the Jews, and Fulfillment of the Law',
    key_ref: 'Matthew 28:18-20', key_text: 'Jesus came to them and spoke to them, saying, "All authority has been given to me in heaven and on earth. Go and make disciples of all nations."',
    background: 'Written primarily for Jewish readers; highlights 60+ OT prophecies, the Sermon on the Mount, and the Great Commission.'
  },
  {
    order: 41, name: 'Mark', testament: 'NEW', category: 'Gospels', total_chapters: 16,
    author: 'John Mark (guided by Peter)', date: 'c. AD 55–60',
    theme: 'Jesus as the Suffering Servant and Miracle-Working Son of God',
    key_ref: 'Mark 10:45', key_text: 'For the Son of Man also came not to be served, but to serve, and to give his life as a ransom for many.',
    background: 'Fast-paced, action-oriented gospel written for Roman audiences, repeatedly using the Greek word "immediately" (euthys).'
  },
  {
    order: 42, name: 'Luke', testament: 'NEW', category: 'Gospels', total_chapters: 24,
    author: 'Luke the Physician', date: 'c. AD 60–62',
    theme: 'Jesus the Compassionate Savior of All Humanity: Outcasts, Women, and the Poor',
    key_ref: 'Luke 19:10', key_text: 'For the Son of Man came to seek and to save that which was lost.',
    background: 'An orderly, historically investigated account written to Theophilus, featuring parables like the Good Samaritan and Prodigal Son.'
  },
  {
    order: 43, name: 'John', testament: 'NEW', category: 'Gospels', total_chapters: 21,
    author: 'John the Apostle', date: 'c. AD 85–95',
    theme: 'Jesus as the Eternal Word (Logos), the "I AM", and Source of Eternal Life',
    key_ref: 'John 20:31', key_text: 'These are written, that you may believe that Jesus is the Christ, the Son of God, and that believing you may have life in his name.',
    background: 'Theological and intimate narrative focusing on 7 signs, 7 "I AM" statements, and the Upper Room discourse.'
  },
  {
    order: 44, name: 'Acts', testament: 'NEW', category: 'History', total_chapters: 28,
    author: 'Luke', date: 'c. AD 62–64',
    theme: 'The Holy Spirit’s Power, the Birth of the Church, and Gospel Spreading to Rome',
    key_ref: 'Acts 1:8', key_text: 'You will receive power when the Holy Spirit has come upon you. You will be witnesses to me in Jerusalem, in all Judea and Samaria, and to the uttermost parts of the earth.',
    background: 'Documents the explosive growth of Christianity from Pentecost through Peter’s ministry and Paul’s three missionary journeys to Rome.'
  },

  // --- PAULINE EPISTLES ---
  {
    order: 45, name: 'Romans', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 16,
    author: 'Paul', date: 'c. AD 57',
    theme: 'The Righteousness of God Revealed: Justification by Faith and Sanctification',
    key_ref: 'Romans 8:1', key_text: 'There is therefore now no condemnation to those who are in Christ Jesus.',
    background: 'Paul’s theological masterpiece addressed to Christians in the capital of the empire, articulating human depravity, grace, and life in the Spirit.'
  },
  {
    order: 46, name: '1 Corinthians', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 16,
    author: 'Paul', date: 'c. AD 55',
    theme: 'Order in the Church, Spiritual Gifts, Christian Unity, and Resurrection Hope',
    key_ref: '1 Corinthians 13:13', key_text: 'Now these three remain: faith, hope, and love; but the greatest of these is love.',
    background: 'Tackles severe moral and theological disorder in cosmopolitan Corinth: factions, lawsuits, sexual immorality, communion abuse, and resurrection doubts.'
  },
  {
    order: 47, name: '2 Corinthians', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 13,
    author: 'Paul', date: 'c. AD 56',
    theme: 'Strength Made Perfect in Weakness and the Ministry of Reconciliation',
    key_ref: '2 Corinthians 12:9', key_text: 'He has said to me, "My grace is sufficient for you, for my power is made perfect in weakness."',
    background: 'Paul’s most vulnerable letter, defending his apostolic authority against "super-apostles" and sharing his "thorn in the flesh".'
  },
  {
    order: 48, name: 'Galatians', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 6,
    author: 'Paul', date: 'c. AD 48–49',
    theme: 'Christian Freedom: Salvation by Grace Alone and the Fruit of the Spirit',
    key_ref: 'Galatians 5:1', key_text: 'Stand firm therefore in the liberty by which Christ has made us free, and don’t be entangled again with a yoke of bondage.',
    background: 'The Magna Carta of Christian liberty, dismantling the Judaizers who insisted that Gentile believers must be circumcised to be saved.'
  },
  {
    order: 49, name: 'Ephesians', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 6,
    author: 'Paul', date: 'c. AD 60–62',
    theme: 'The Believer’s Riches in Christ, Unity in the Body, and the Whole Armor of God',
    key_ref: 'Ephesians 2:8-9', key_text: 'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, that no one would boast.',
    background: 'Written from a Roman prison; reveals cosmic mysteries of the Church and equips believers for spiritual warfare.'
  },
  {
    order: 50, name: 'Philippians', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 4,
    author: 'Paul', date: 'c. AD 61',
    theme: 'Unshakable Joy, Humility of Christ, and Contentment in All Circumstances',
    key_ref: 'Philippians 4:13', key_text: 'I can do all things through Christ, who strengthens me.',
    background: 'A warm letter of thanks from prison to his loyal supporters in Philippi, featuring the Christological hymn of Philippians 2.'
  },
  {
    order: 51, name: 'Colossians', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 4,
    author: 'Paul', date: 'c. AD 60–62',
    theme: 'The Preeminence, Supremacy, and All-Sufficiency of Jesus Christ',
    key_ref: 'Colossians 1:18', key_text: 'He is the head of the body, the assembly, who is the beginning, the firstborn from the dead; that in all things he might have the preeminence.',
    background: 'Refutes syncretic proto-gnostic heresy that elevated angels and legalistic asceticism above Christ.'
  },
  {
    order: 52, name: '1 Thessalonians', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 5,
    author: 'Paul', date: 'c. AD 51',
    theme: 'Holy Living, Faith Under Persecution, and the Blessed Hope of Christ’s Return',
    key_ref: '1 Thessalonians 4:16-17', key_text: 'For the Lord himself will descend from heaven with a shout... Then we who are alive and remain will be caught up together with them in the clouds to meet the Lord in the air.',
    background: 'Written shortly after establishing the church amidst riots, comforting them regarding deceased believers and Christ’s return.'
  },
  {
    order: 53, name: '2 Thessalonians', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 3,
    author: 'Paul', date: 'c. AD 51–52',
    theme: 'Clarifying the Day of the Lord, the Man of Lawlessness, and Diligent Living',
    key_ref: '2 Thessalonians 3:3', key_text: 'The Lord is faithful, who will establish you and guard you from the evil one.',
    background: 'Corrects false rumors that the Day of the Lord had already occurred and admonishes idle members to work.'
  },
  {
    order: 54, name: '1 Timothy', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 6,
    author: 'Paul', date: 'c. AD 63–65',
    theme: 'Pastoral Leadership, Sound Doctrine, and Order in the Local Church',
    key_ref: '1 Timothy 4:12', key_text: 'Let no man despise your youth; but be an example to those who believe, in word, in your way of life, in love, in spirit, in faith, and in purity.',
    background: 'Mentoring young pastor Timothy facing false teachers and administrative challenges in Ephesus.'
  },
  {
    order: 55, name: '2 Timothy', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 4,
    author: 'Paul', date: 'c. AD 66–67',
    theme: 'Finishing the Race, Guarding the Gospel, and the Inspiration of Scripture',
    key_ref: '2 Timothy 4:7', key_text: 'I have fought the good fight. I have finished the course. I have kept the faith.',
    background: 'Paul’s emotional last will and testament written from a cold Mamertine prison dungeon in Rome shortly before his execution.'
  },
  {
    order: 56, name: 'Titus', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 3,
    author: 'Paul', date: 'c. AD 63–65',
    theme: 'Appointing Elders, Sound Doctrine, and Adorning the Gospel with Good Works',
    key_ref: 'Titus 2:11', key_text: 'For the grace of God has appeared, bringing salvation to all men.',
    background: 'Written to Titus on the island of Crete, notorious for its rebellious culture, to establish order in church assemblies.'
  },
  {
    order: 57, name: 'Philemon', testament: 'NEW', category: 'Pauline Epistles', total_chapters: 1,
    author: 'Paul', date: 'c. AD 60–62',
    theme: 'Reconciliation, Forgiveness, and Receiving a Runaway Slave as a Brother',
    key_ref: 'Philemon 1:16', key_text: 'No longer as a slave, but more than a slave, a beloved brother.',
    background: 'A personal masterclass in grace; Paul intercedes for Onesimus, a runaway slave who met Christ in prison.'
  },

  // --- GENERAL EPISTLES & REVELATION ---
  {
    order: 58, name: 'Hebrews', testament: 'NEW', category: 'General Epistles', total_chapters: 13,
    author: 'Unknown (Paul, Apollos, Luke, or Barnabas)', date: 'c. AD 64–68',
    theme: 'The Superiority of Christ Over Angels, Moses, and the Levitical System',
    key_ref: 'Hebrews 11:1', key_text: 'Now faith is assurance of things hoped for, proof of things not seen.',
    background: 'Urges Jewish Christians facing persecution not to slip back into Judaism, celebrating the ultimate Hall of Faith.'
  },
  {
    order: 59, name: 'James', testament: 'NEW', category: 'General Epistles', total_chapters: 5,
    author: 'James (Brother of Jesus)', date: 'c. AD 45–48',
    theme: 'Living Faith Proved by Action, Taming the Tongue, and Heavenly Wisdom',
    key_ref: 'James 1:22', key_text: 'Be doers of the word, and not only hearers, deluding your own selves.',
    background: 'Likely the earliest written NT book; delivers rapid-fire wisdom for enduring trials and avoiding dead legalism.'
  },
  {
    order: 60, name: '1 Peter', testament: 'NEW', category: 'General Epistles', total_chapters: 5,
    author: 'Peter', date: 'c. AD 64',
    theme: 'Living Hope Amidst Fiery Trials and Standing Firm in Grace',
    key_ref: '1 Peter 5:7', key_text: 'Casting all your worries on him, because he cares for you.',
    background: 'Encourages believers dispersed throughout Asia Minor suffering state-sponsored slander and ostracization under Nero.'
  },
  {
    order: 61, name: '2 Peter', testament: 'NEW', category: 'General Epistles', total_chapters: 3,
    author: 'Peter', date: 'c. AD 66–67',
    theme: 'Guarding Against False Teachers, Growing in Knowledge, and the Day of the Lord',
    key_ref: '2 Peter 3:9', key_text: 'The Lord is not slow concerning his promise, as some count slowness; but is patient with us, not wishing that any should perish, but that all should come to repentance.',
    background: 'Peter’s farewell warning against seductive mockers denying the second coming and promoting antinomian licentiousness.'
  },
  {
    order: 62, name: '1 John', testament: 'NEW', category: 'General Epistles', total_chapters: 5,
    author: 'John the Apostle', date: 'c. AD 85–90',
    theme: 'Fellowship with God, Walking in Light and Love, and Assurance of Eternal Life',
    key_ref: '1 John 4:8', key_text: 'He who doesn’t love doesn’t know God, for God is love.',
    background: 'Offers tests of genuine belief (righteousness, love for brethren, confessing Jesus came in the flesh) against early Gnosticism.'
  },
  {
    order: 63, name: '2 John', testament: 'NEW', category: 'General Epistles', total_chapters: 1,
    author: 'John the Apostle', date: 'c. AD 85–90',
    theme: 'Walking in Truth and Love While Rejecting Deceivers',
    key_ref: '2 John 1:6', key_text: 'This is love, that we should walk according to his commandments.',
    background: 'A brief pastoral note warning a house church not to provide shelter or hospitality to false teachers traveling around.'
  },
  {
    order: 64, name: '3 John', testament: 'NEW', category: 'General Epistles', total_chapters: 1,
    author: 'John the Apostle', date: 'c. AD 85–90',
    theme: 'Hospitality to Gospel Workers, Warning Against Dictatorial Leaders (Diotrephes)',
    key_ref: '3 John 1:11', key_text: 'Beloved, don’t imitate that which is evil, but that which is good. He who does good is of God.',
    background: 'Commends Gaius for his faithful support of itinerant teachers while warning against autocratic church politics.'
  },
  {
    order: 65, name: 'Jude', testament: 'NEW', category: 'General Epistles', total_chapters: 1,
    author: 'Jude (Brother of James and Jesus)', date: 'c. AD 65–70',
    theme: 'Contending Earnestly for the Faith Once Delivered to the Saints',
    key_ref: 'Jude 1:24-25', key_text: 'Now to him who is able to keep them from stumbling, and to present you faultless before the presence of his glory in great joy, to God our Savior... be glory, majesty, dominion, and power.',
    background: 'An urgent battle-cry against infiltrators turning God’s grace into a license for immorality.'
  },
  {
    order: 66, name: 'Revelation', testament: 'NEW', category: 'Prophecy', total_chapters: 22,
    author: 'John the Apostle', date: 'c. AD 95',
    theme: 'The Unveiling of the Triumphant Christ, Defeat of Satan, and New Heavens and New Earth',
    key_ref: 'Revelation 21:4', key_text: 'He will wipe away from them every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.',
    background: 'Received on the prison island of Patmos; unveils letters to 7 churches, vivid apocalyptic throne rooms, trumpet and bowl judgments, and the eternal New Jerusalem.'
  }
];

function seedBibleBooks() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM bible_books').get();
  if (existing.count >= 66) {
    console.log('[Seeds] Bible books table already contains 66 books.');
    return;
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO bible_books (
      id, book_order, name, testament, category, total_chapters,
      author_tradition, approximate_date, central_theme,
      key_verse_reference, key_verse_text, historical_background
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    for (const b of BIBLE_BOOKS_DATA) {
      insert.run(
        b.order, b.order, b.name, b.testament, b.category, b.total_chapters,
        b.author, b.date, b.theme, b.key_ref, b.key_text, b.background
      );
    }
    db.exec('COMMIT');
    console.log('[Seeds] Successfully seeded all 66 books of the Bible into SQLite database.');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[Seeds] Error seeding bible books:', err);
    throw err;
  }
}

module.exports = {
  BIBLE_BOOKS_DATA,
  seedBibleBooks
};
